﻿wwt.controllers.controller(
  'OpenItemController',
  [
    '$rootScope',
    '$scope',
    'AppState',
    'Places',
    'Util',
    'Astrometry',
    'MediaFile',

    function ($rootScope, $scope, appState, places, util, astrometry, media) {
      $rootScope.$on('openItem', function () {
        $scope.openItemUrl = '';
        setTimeout(function () {
          $('#txtOpenItem').focus();
        }, 100);
      });

      $scope.tour = {edit: false};

      $scope.openItem = function () {
        var itemType = $rootScope.openType;

        if (itemType === 'collection') {
          places.openCollection($scope.openItemUrl).then(function (folder) {
            util.log('initExplorer broadcast', folder);
            $rootScope.newFolder = folder;
            $rootScope.$broadcast('initExplorer', $scope.openItemUrl);
            $('#openModal').modal('hide');
          });
        } else if (itemType === 'tour') {
          $scope.playTour($scope.openItemUrl, !!$scope.tour.edit);
          $('#openModal').modal('hide');
        } else if (itemType === 'FITS image') {
          wwt.wc.loadFits($scope.openItemUrl);
          setTimeout(wwt.detectNewLayers, 555);
          $('#openModal').modal('hide');
        } else {
          places.importImage($scope.openItemUrl).then(function (folder) {
            if (folder) {
              util.log('initExplorer broadcast', folder);
              $rootScope.newFolder = folder;
              $rootScope.$broadcast('initExplorer', $scope.openItemUrl);
              $('#openModal').modal('hide');
            } else {
              $scope.importState = 'notAVMTagged';
              $scope.imageFail = true;
            }
          });
        }
      };

      $scope.mediaFileChange = function (e) {
        var type = $rootScope.openType;
        var file = e.target.files[0];

        if (!file.name) {
          return;
        }

        $scope[type + 'FileName'] = file.name;

        media.addLocalMedia(type, file).then(function (mediaResult) {
          $scope.openItemUrl = mediaResult.url;
          $scope.openItem();
          $('#addFileReset')[0].reset();
        });
      };

      $scope.astrometryStatusText = '';

      $scope.astroCallback = function (data) {
        $scope.$applyAsync(function () {
          if ($scope.astrometryStatusText.indexOf(data.message) == 0) {
            $scope.astrometryStatusText += ' .';
          } else {
            $scope.astrometryStatusText = data.message;
          }
        });

        if (data.calibration) {
          $scope.importState = 'astrometrySuccess';
          var qs = '&ra=' + data.calibration.ra +
              '&dec=' + data.calibration.dec +
              '&scale=' + (data.calibration.scale / 3600) +
              '&rotation=' + data.calibration.rotation;
          if (data.calibration.parity !== 1) {
            qs += '&reverseparity=true';
          }

          places.importImage($scope.openItemUrl, qs).then(function (folder) {
            $rootScope.newFolder = folder;
            $rootScope.$broadcast('initExplorer', $scope.openItemUrl);
            $scope.imageFail = false;
            $scope.importState = '';
            $('#openModal').modal('hide');
            return;
          });
        }

        if (data.status.toLowerCase().indexOf('fail') != -1) {
          $scope.importState = 'astrometryFail';
        }
      }

      $scope.solveAstrometry = function () {
        $scope.importState = 'astrometryProgress';
        astrometry.submitImage($scope.openItemUrl, $scope.astroCallback, false);
      };
    }
  ]
);
