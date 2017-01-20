'use strict';

/**
 * @ngdoc overview
 * @name daysOffAngularApp
 * @description
 * # daysOffAngularApp
 *
 * Main module of the application.
*/
angular.module('daysOffAngularApp', ['ui.router','ngResource','ngDialog'])
.config(function($stateProvider, $urlRouterProvider) {
        $stateProvider

            // route for the home page
            .state('app', {
                url:'/',
                views: {
                    'header': {
                        templateUrl : 'views/header.html',
                        controller: 'HeaderController'
                    },
                    'content': {
                        templateUrl : 'views/main.html',
                        controller  : 'MainCtrl'
                    },
                    'footer': {
                        templateUrl : 'views/footer.html',
                    }
                }

            })

            // route for the requests page
            .state('app.requests', {
                url:'requests',
                views: {
                    'content@': {
                        templateUrl : 'views/requests.html',
                        controller  : 'RequestsController'
                    }
                }
            })

            // route for the employees page
            .state('app.employees', {
                url:'employees',
                views: {
                    'content@': {
                        templateUrl : 'views/employees.html',
                        controller  : 'EmployeesController'
                    }
                }
            })


            // route for the requestdetail page
            .state('app.requestdetails', {
                url: 'requests/:id',
                views: {
                    'content@': {
                        templateUrl : 'views/requestdetails.html',
                        controller  : 'RequestDetailController'
                   }
                }
            });

        $urlRouterProvider.otherwise('/');
    })

    .config(['$httpProvider', function($httpProvider) {
            $httpProvider.defaults.useXDomain = true;
            delete $httpProvider.defaults.headers.common['X-Requested-With'];
        }
    ]);
;
