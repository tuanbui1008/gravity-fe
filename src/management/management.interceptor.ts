/*
 * Copyright (C) 2015 The Gravitee team (http://gravitee.io)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import NotificationService from '../services/notification.service';
import UserService from "../services/user.service";
import ReCaptchaService from "../services/reCaptcha.service";

function interceptorConfig(
  $httpProvider: angular.IHttpProvider,
  Constants
) {
  'ngInject';
  $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

  $httpProvider.defaults.withCredentials = true;

  // Explicitly disable automatic csrf handling as it will not work for cross-domain (using custom csrf interceptor).
  $httpProvider.defaults.xsrfCookieName = 'none';
  $httpProvider.defaults.xsrfHeaderName = 'none';

  let sessionExpired;

  const interceptorUnauthorized = ($q: angular.IQService, $injector: angular.auto.IInjectorService, $location, $state): angular.IHttpInterceptor => ({
    responseError: function (error) {
      if (error.config && !error.config.tryItMode) {
        const unauthorizedError = !error || error.status === 401;
        let errorMessage = '';

        const notificationService = ($injector.get('NotificationService') as NotificationService);
        const userService =  ($injector.get('UserService') as UserService);
        const $timeout = $injector.get('$timeout');
        if (unauthorizedError) {
          if (error.config.headers.Authorization) {
            sessionExpired = false;
            errorMessage = 'Wrong user or password';
          } else {
            // if on portal home do not redirect
            error.config.forceSessionExpired =
              $location.$$path !== ''
              && $location.$$path !== '/'
              && $location.$$path !== '/login'
              && !$location.$$path.startsWith("/registration/confirm")
              && !$location.$$path.startsWith("/resetPassword")
              && !error.config.url.startsWith(Constants.baseURL.endsWith('/') ? Constants.baseURL + 'user' :  Constants.baseURL + '/user/');
            if (error.config.forceSessionExpired || (!sessionExpired && !error.config.silentCall)) {
              sessionExpired = true;
              // session expired
              notificationService.showError(error, 'Session expired, redirecting to home...');
              let redirectUri = $location.$$path;
              $timeout(function () {
                userService.removeCurrentUserData();
                $injector.get('$rootScope').$broadcast('graviteeUserRefresh', {});
                $injector.get('$rootScope').$broadcast('graviteeUserCancelScheduledServices');
                $injector.get('$rootScope').$broadcast('graviteeLogout', {redirectUri: redirectUri});
              }, 2000);
            }
          }
        } else {
          if (error.status === 500) {
            errorMessage = error.data ? error.data.message : 'Unexpected error';
          } else if (error.status === 503) {
            if (error.data && error.data.message) {
              document.getElementsByTagName('body').item(0).innerText = error.data.message;
            }
            errorMessage = error.data ? error.data.message : 'Server unavailable';
          }
        }
        if (!sessionExpired && error && error.status > 0 && !error.config.silentCall) {
          notificationService.showError(error, errorMessage);
          if (error.status === 403) {
            // if the user try to access a forbidden resource (after redirection for example), do not stay on login form
            $timeout(function () {$state.go('portal.home');});
          }
        }
      }

      return $q.reject(error);
    }
  });

  const interceptorTimeout = function ($q: angular.IQService, $injector: angular.auto.IInjectorService): angular.IHttpInterceptor {
    return {
      request: function (config) {
        // Use defined HTTP timeout or default value
        config.timeout = config.timeout || 10000;
        return config;
      },
      responseError: function (error) {
        const notificationService = ($injector.get('NotificationService') as NotificationService);
        if (!error.config || !error.config.silentCall) {
          if (error.config && !error.config.tryItMode) {
            if (error && error.status <= 0 && error.xhrStatus !== "abort") {
              notificationService.showError('Server unreachable');
            }
          } else {
            notificationService.showError('Unable to call the remote service.');
          }
        }
        return $q.reject(error);
      }
    };
  };

  let xsrfToken;

  const csrfInterceptor = function ($q: angular.IQService, $injector: angular.auto.IInjectorService): angular.IHttpInterceptor {
    return {
      request: function (config) {
        config.headers['X-Xsrf-Token'] = xsrfToken;
        return config;
      },
      response: function(response) {
        if(response.headers('X-Xsrf-Token')) {
          xsrfToken = response.headers('X-Xsrf-Token');
        }
        return response;
      },
      responseError: function(response) {
        if(response.headers('X-Xsrf-Token')) {
          xsrfToken = response.headers('X-Xsrf-Token');
        }
        return $q.reject(response);
      }
    };
  };

  const reCaptchaInterceptor = function ($q: angular.IQService, $injector: angular.auto.IInjectorService): angular.IHttpInterceptor {

    return {
      request: function (config) {
        let reCaptchaService: ReCaptchaService = $injector.get('ReCaptchaService');

        if (reCaptchaService && reCaptchaService.isEnabled()) {
          config.headers[reCaptchaService.getHeaderName()] = reCaptchaService.getCurrentToken();
        }
        return config;
      }
    };
  };

  if ($httpProvider.interceptors) {
    $httpProvider.interceptors.push(csrfInterceptor);
    $httpProvider.interceptors.push(reCaptchaInterceptor);
    $httpProvider.interceptors.push(interceptorUnauthorized);
    $httpProvider.interceptors.push(interceptorTimeout);
  }
}

export default interceptorConfig;
