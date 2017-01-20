'use strict';

/**
 * @ngdoc function
 * @name daysOffAngularApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the daysOffAngularApp
 */
angular.module('daysOffAngularApp')
  .controller('MainCtrl', function () {
    this.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  })

// This controller is used to handle the commands on the top bar.
.controller('HeaderController', ['$scope', '$state', '$rootScope', 'AuthFactory', 'ngDialog', 'employeeFactory', function ($scope, $state, $rootScope, AuthFactory, ngDialog,employeeFactory) {

      $scope.loggedIn = false;
      $scope.username = '';

      if(AuthFactory.isAuthenticated()) {
          $scope.loggedIn = true;
          $scope.username = AuthFactory.getUsername();
      }

      $scope.openLogin = function () {
          ngDialog.open({ template: 'views/login.html', scope: $scope, className: 'ngdialog-theme-default', controller:'LoginController' });
      };

      $scope.logOut = function() {
         AuthFactory.logout();
          $scope.loggedIn = false;
          $scope.username = '';
      };

      // Intercept the event fired after a successful login
      $rootScope.$on('login:Successful', function () {
          $scope.loggedIn = AuthFactory.isAuthenticated();
          $scope.username = AuthFactory.getUsername();
          $scope.userId = AuthFactory.getUserId();
          employeeFactory.getEmployee($scope.userId).then(
            function (response) {console.log('user details OK= '+ JSON.stringify(response.data));},
            function (response) {console.log('user details KO= '+ JSON.stringify(response.data));}
          );
      });

      // Intercept the event fired after a successful registration of a new user
      $rootScope.$on('registration:Successful', function () {
          $scope.loggedIn = AuthFactory.isAuthenticated();
          $scope.username = AuthFactory.getUsername();
      });

      $scope.stateis = function(curstate) {
         return $state.is(curstate);
      };

  }])

// This controller is used by the 'requests' page to display requests according to the user level and also to perform actions (approve, deny, delete) on each request
.controller('RequestsController',['$scope','requestFactory','ngDialog', '$rootScope','employeeFactory', 'AuthFactory', function ($scope,requestFactory,ngDialog,$rootScope,employeeFactory,AuthFactory) {

    var userId = AuthFactory.getUserId();
    $scope.filtText = '';
    $scope.IsManager = false;
    $scope.employees = [];
    $scope.user = employeeFactory.getEmployee(userId).then(
      function (response) {
        console.log('user details OK= '+ JSON.stringify(response.data));
        $scope.IsManager = response.data.IsManager;
        if($scope.IsManager == false){
          $scope.filtText=userId;
          console.log('filtText is not empty: '+ userId);
        }
      },
      function (response) {console.log('user details KO= '+ JSON.stringify(response.data));}
    );

    // Read the full list of employees. It is used to get a local copy of employees' details instead of retrieving data from the server every time you need it (caching to improve performances)
    $scope.employees = employeeFactory.getEmployees().query(
        function (response) {
            $scope.employees = response;
            console.log('Loaded '+ $scope.employees.length + ' employees');

        },
        function (response) {
            console.log('Failed when loading employees');
        }
      );

    // given the employee's ID, return the username to be displayed in the "Requested by" and "Approved by" fields
    $scope.getEmployeeName = function (empId) {
      var retval = empId;
      for(var i = 0; i < $scope.employees.length; i++)
      {
        if($scope.employees[i].id == empId)
        {
          retval=$scope.employees[i].username;
          console.log('Found username: ' + retval);
          return retval;
        }
      }
      return retval;
    };

    // Read the full list of requests. Any filtering is done on the client side using AngularJS filters
    $scope.requests = requestFactory.getRequests().query(
        function (response) {
            $scope.requests = response;
            console.log('Response OK= '+ JSON.stringify(response));
            $scope.showMenu = true;

        },
        function (response) {
            console.log('Response KO= '+JSON.stringify(response));
            $scope.message = 'Error: ' + response.status + ' ' + response.statusText;
        }
      );

    // this function is required in order to ensure data reload after an action that affects displayed data
    $scope.reload = function () {
      requestFactory.getRequests().query(
          function (response) {
              // console.log('Reload OK= '+ JSON.stringify(response));
              $scope.requests = response;
              console.log('Reload OK = '+ JSON.stringify($scope.requests));

          },
          function (response) {
              console.log('Reload KO= '+JSON.stringify(response));
              // return response;
          }
        );
    };


    // open a pop-up form when user wants to add a new request
    $scope.openNewRequest = function () {
            ngDialog.open({ template: 'views/newrequest.html', scope: $scope, className: 'ngdialog-theme-default', controller:'NewRequestController' });
        };


    // according to the passed parameters, approve or deny a request by setting the "Status" field
    $scope.approveDenyRequest = function(requestId, newStatus) {
            $scope.request = {};
            console.log('Approving request ' + requestId);

            $scope.request = requestFactory.getRequest(requestId).then(
            function(response){
              // success callback
              $scope.request =response.data;
              console.log('GET SUCCESS: here is the response ' +  JSON.stringify(response));
              $scope.request.Status = newStatus;
              console.log('Now setting status of ' + $scope.request.id + ' as ' + $scope.request.Status);
              var res = requestFactory.setRequest($scope.request.id,$scope.request).then(
                function(response){
                  $scope.requests = $scope.reload();
                },
                function(response){
                  console.log('PUT FAILURE: here is the response ' +  JSON.stringify(response));
                }
              );
            },
            function(response){
                // failure callback
                console.log('GET FAILURE: here is the response ' +  JSON.stringify(response));
            }
          );
        };

      // permanently remove a request
      $scope.removeRequest = function(requestId) {
            $scope.request = {};
            console.log('Removing request ' + requestId);

            $scope.request = requestFactory.getRequest(requestId).then(
              function(response){
                // success callback
                $scope.request =response.data;
                console.log('GET SUCCESS: here is the response ' +  JSON.stringify(response));
                requestFactory.deleteRequest($scope.request.id,$scope.request).then(
                  function(response){
                    $scope.requests = $scope.reload();
                  },
                  function(response){
                    console.log('DELETE FAILURE: here is the response ' +  JSON.stringify(response));
                  }
                );
              },
              function(response){
                // failure callback
                console.log('GET FAILURE: here is the response ' +  JSON.stringify(response));
              }
            );

        };

      // detect an event fired when a new request has been successfully added
      $rootScope.$on('newRequest:Successful', function () {
            console.log('Got an event!');
            $scope.requests = $scope.reload();
      });

      // Convert status ID into a user friendly text to be displayed
      $scope.getStatusMessage = function(status){
          if (status === 0) {
              return "New";
          }
          else if (status === 1) {
              return "Approved";
          }
          else if (status === 2) {
              return "Denied";
          }
          else {
              return "Unknown";
          }

      };

      // return true if logged in user is a supervisor. This check is useful because only supervisors can access to some information and actions
      $scope.isSupervisor = function() {
          console.log('Supervisor = ' +$scope.IsManager);
          return $scope.IsManager;
      };

      // given the employee's ID, return the username to be displayed in the "Requested by" and "Approved by" fields
      $scope.getUsername = function(employeeId) {
            $scope.request = {};
            console.log('Looking for ' + employeeId);

            $scope.request = employeeFactory.getEmployee(employeeId).then(
              function(response){
                // success callback
                console.log('User found ' +  response.data.username);
                return response.data.username;
              },
              function(response){
                // failure callback
                console.log('USER GET FAILURE: here is the response ' +  JSON.stringify(response));
              }
            );

        };

  }])

// This controller is used by the 'new request' form 
.controller('NewRequestController', ['$scope','requestFactory', 'ngDialog', function ($scope,requestFactory,ngDialog) {
    $scope.doRequest = function() {
        requestFactory.newRequest($scope.requestData);
        ngDialog.close();
    };

  }])

// This controller is used by the 'details' page
.controller('RequestDetailController', ['$scope','requestFactory', '$stateParams', function ($scope,requestFactory,$stateParams) {

    console.log('Resource ID = '+ $stateParams.id + ' ' +parseInt($stateParams.id,10));
    $scope.request = {};
    $scope.request.id = $stateParams.id;
    var Requests = requestFactory.getRequests();
    var reqs = Requests.query(
      function() {
        for(var i = 0; i < reqs.length; i++)
        {
          if(reqs[i].id == $stateParams.id)
          {
            $scope.request=reqs[i];
          }
        }
      },
      function() {
        console.log("error found in getRequests");
      }

);


}])

// This controller is used by the 'employees' page. It allows displaying of active users
.controller('EmployeesController', ['employeeFactory', '$scope', function (employeeFactory,$scope) {

    // return the full list of employees, together with all the details
    $scope.employees = employeeFactory.getEmployees().query(
        function (response) {
            $scope.employees = response;
            console.log('Loaded '+ $scope.employees.length + ' employees');
        },
        function (response) {
            console.log('Failed when loading employees');
        }
      );

      // since image upload is not available yet, I'm forcing a couple of default icons
      $scope.getImage = function(isManager) {
        if(isManager){
          return "images/boss.png";
        }
        else{
          return "images/geek.jpg";
        }
      }

      // return an user friendly text to be displayed
      $scope.getLabel = function(isManager) {
        if(isManager){
          return "Manager";
        }
        else{
          return "";
        }
      }
  }])

// This controller is used by the form used to add new users (sign up)
.controller('RegisterController', ['$scope', 'ngDialog', '$localStorage', 'AuthFactory', function ($scope, ngDialog, $localStorage, AuthFactory) {

      $scope.register={};
      $scope.loginData={};

      $scope.doRegister = function() {
          console.log('Doing registration', $scope.registration);

          AuthFactory.register($scope.registration);

          ngDialog.close();

      };
  }])

// This controller is used by the login form
.controller('LoginController', ['$scope', 'ngDialog', '$localStorage', 'AuthFactory', function ($scope, ngDialog, $localStorage, AuthFactory) {

      $scope.loginData = $localStorage.getObject('userinfo','{}');

      $scope.doLogin = function() {
          if($scope.rememberMe) {
            $localStorage.storeObject('userinfo',$scope.loginData);
          }

          AuthFactory.login($scope.loginData);

          ngDialog.close();

      };

      $scope.openRegister = function () {
          ngDialog.open({ template: 'views/register.html', scope: $scope, className: 'ngdialog-theme-default', controller:'RegisterController' });
      };

}])
;
