'use strict';

/**
 * @ngdoc function
 * @name gmapsZoneCreatorApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the gmapsZoneCreatorApp
 */
angular.module('gmapsZoneCreatorApp')
  .controller('MainCtrl', function ($scope, $mdToast) {
    var geocoder = new google.maps.Geocoder();
    $scope.step = 0;
    $scope.testAddress = {};
    $scope.newMarker = {};

    var geoCodingToast = $mdToast.simple()
      .content('Geocoding the address...')
      .hideDelay(0);

    $scope.startDemo = function () {
      $scope.step = 1;
    };

    $scope.onSplitted = function () {
      $scope.step = 4;
      $scope.$apply();
    };

    $scope.onSplittingStart = function () {
      $scope.step = 2;
      $scope.$apply();
    };

    $scope.onFirstSegmentDrawn = function () {
      $scope.step = 3;
      $scope.$apply();
    };

    $scope.testGeocodedAddress = function (lat, lng) {
      $scope.newMarker = {lat: lat, lng: lng};
    };

    $scope.testFreeAddress = function () {
      $mdToast.show(geoCodingToast);
      geocoder.geocode({'address': $scope.testAddress.text}, function (results, status) {
        $mdToast.hide(geoCodingToast);
        if (status === google.maps.GeocoderStatus.OK) {
          $scope.testGeocodedAddress(results[0].geometry.location.lat(), results[0].geometry.location.lng());
          $scope.$apply();
        } else {
          var toast = $mdToast.simple()
            .content('Geocode was not successful for the following reason: ' + status)
            .action('OK')
            .highlightAction(true);
          $mdToast.show(toast);
        }
      });
    };
  });
