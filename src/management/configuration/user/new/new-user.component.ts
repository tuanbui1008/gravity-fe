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
import UserService from '../../../../services/user.service';
import NotificationService from '../../../../services/notification.service';
import { StateService } from '@uirouter/core';

const NewUserComponent: ng.IComponentOptions = {
  template: require('./new-user.html'),
  bindings: {
    identityProviders: '<'
  },
  controller: function (
    UserService: UserService,
    NotificationService: NotificationService,
    $state: StateService
  ) {
    'ngInject';

    this.$onInit = () => {
      if (this.identityProviders && this.identityProviders.length) {
        this.identityProviders.unshift({ id: 'gravitee', name: 'Gravitee' });
        this.user = { source: 'gravitee' };
      }
    };

    this.create = () => {
      UserService.create(this.user).then(() => {
        NotificationService.show('User registered with success');
        $state.go('management.settings.users');
      });
    };

    this.displayProviders = () => {
      return this.identityProviders && this.identityProviders.length > 1;
    }

    this.displayProviderIdentifier = () => {
      return this.displayProviders() && this.user.source !== 'gravitee';
    }
  }
};

export default NewUserComponent;
