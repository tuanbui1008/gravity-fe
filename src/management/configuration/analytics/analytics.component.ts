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
import NotificationService from "../../../services/notification.service";
import PortalConfigService from "../../../services/portalConfig.service";
import { StateService } from '@uirouter/core';
import _ = require('lodash');
import DashboardService from "../../../services/dashboard.service";
import {Dashboard} from "../../../entities/dashboard";

const AnalyticsSettingsComponent: ng.IComponentOptions = {
  bindings: {
    dashboardsPlatform: '<',
    dashboardsApi: '<',
    dashboardsApplication: '<'
  },
  template: require('./analytics.html'),
  controller: function(
    NotificationService: NotificationService,
    PortalConfigService: PortalConfigService,
    $state: StateService,
    Constants: any,
    $mdDialog: angular.material.IDialogService,
    DashboardService: DashboardService,
    $rootScope
  ) {
    'ngInject';
    this.settings = _.cloneDeep(Constants);
    this.$rootScope = $rootScope;

    this.$onInit = () => {
      this.dashboardsByType = {
        Platform: this.dashboardsPlatform,
        API: this.dashboardsApi,
        Application: this.dashboardsApplication
      };
    };

    this.isDashboardsEmpty = () => {
      return _.flattenDeep(_.values(this.dashboardsByType)).length === 0;
    };

    this.save = () => {
      PortalConfigService.save(this.settings).then( (response) => {
        _.merge(Constants, response.data);
        NotificationService.show("Configuration saved");
        this.formSettings.$setPristine();
      });
    };

    this.reset = () => {
      this.settings = _.cloneDeep(Constants);
      this.formSettings.$setPristine();
    };

    this.delete = (dashboard: Dashboard) => {
      $mdDialog.show({
        controller: 'DialogConfirmController',
        controllerAs: 'ctrl',
        template: require('../../../components/dialog/confirmWarning.dialog.html'),
        clickOutsideToClose: true,
        locals: {
          title: `Are you sure you want to delete the dashboard '${dashboard.name}'?`,
          msg: '',
          confirmButton: 'Delete'
        }
      }).then(function (response) {
        if (response) {
          DashboardService.delete(dashboard).then(response => {
            NotificationService.show("Dashboard '" + dashboard.name + "' has been deleted");
            $state.go($state.current, {}, {reload: true});
          });
        }
      });
    };

    this.update = (dashboard: Dashboard) => {
      DashboardService.update(dashboard).then(() => {
          NotificationService.show("Dashboard saved with success");
        }).finally(() => {
        $state.go($state.current, {}, {reload: true});
      });
    };

    this.upward = (dashboard: Dashboard) => {
      dashboard.order--;
      this.update(dashboard);
    };

    this.downward = (dashboard: Dashboard) => {
      dashboard.order++;
      this.update(dashboard);
    };

    this.toggleEnable = (dashboard: Dashboard) => {
      dashboard.enabled = !dashboard.enabled;
      this.update(dashboard);
    };
  }
};

export default AnalyticsSettingsComponent;
