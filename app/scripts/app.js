'use strict';

/**
 * @ngdoc overview
 * @name gmapsZoneCreatorApp
 * @description
 * # gmapsZoneCreatorApp
 *
 * Main module of the application.
 */
angular
  .module('gmapsZoneCreatorApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ngMaterial'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
