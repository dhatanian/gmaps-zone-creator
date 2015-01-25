'use strict';

/**
 * @ngdoc function
 * @name gmapsZoneCreatorApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the gmapsZoneCreatorApp
 */
angular.module('gmapsZoneCreatorApp')
  .controller('MainCtrl', function ($scope) {
    $scope.step = 0;
    $scope.newMarker = {};
    $scope.startDemo = function () {
      console.log("start");
      $scope.step = 1;
    };

    $scope.onSplitted = function () {
      console.log("Splitting done, changing to next tab");
      $scope.step = 4;
      $scope.$apply();
    };

    $scope.onSplittingStart = function () {
      console.log("Splitting starts, changing to next tab");
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
  });
