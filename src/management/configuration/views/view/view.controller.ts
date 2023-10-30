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
import ViewService from '../../../../services/view.service';
import NotificationService from '../../../../services/notification.service';
import ApiService from "../../../../services/api.service";
import * as _ from 'lodash';
import { StateService } from '@uirouter/core';
import {IScope} from "angular";

class ViewController {
  private createMode: boolean = false;
  private allApis: any[];
  private initialView: any;
  private view: any;
  private viewApis: any[];
  private selectedAPIs: any[];
  private addedAPIs: any[];
  public searchText: string = "";
  public viewForm: any;
  private formChanged: boolean = false;

  constructor(
    private ApiService: ApiService,
    private ViewService: ViewService,
    private NotificationService: NotificationService,
    private $q: ng.IQService,
    private $filter: ng.IFilterService,
    private $state: StateService,
    private $location: ng.ILocationService,
    private $mdDialog: angular.material.IDialogService,
    private $scope: IScope) {
    'ngInject';
    this.createMode = $location.path().endsWith('new');

  }

  $onInit() {
    this.addedAPIs = [];
    this.selectedAPIs = (this.viewApis) ? this.viewApis.slice(0) : [];
    let self = this;
    this.$scope.$on("apiPictureChangeSuccess", function(event, args) {
      self.view.picture = args.image;
      self.formChanged = true;
    });
    this.initialView = _.cloneDeep(this.view);

  }

  reset() {
    this.view = _.cloneDeep(this.initialView);
    this.formChanged = false;
    if (this.viewForm) {
      this.viewForm.$setPristine();
      this.viewForm.$setUntouched();
    }
  }

  save() {
    let that = this;
    let viewFunction = (this.createMode) ? this.ViewService.create(this.view) : this.ViewService.update(this.view);
    viewFunction
      .then(response => {
        let view = response.data;
        // update view's apis
        let apiFunctions = this.addedAPIs.map(api => {
          let apiViews = api.views || [];
          apiViews.push(view.id);
          api.views = apiViews;
          return that.ApiService.update(api);
        });
        that.$q.all(apiFunctions).then(() => {
          that.NotificationService.show('View ' + view.name + ' has been saved.');
          that.$state.go('management.settings.view', {viewId: view.key}, {reload:true})
        });
      })
  }

  searchAPI(searchText) {
    let that = this;
    if (that.allApis) {
      let apisFound = _.filter(that.allApis, api => !that.selectedAPIs.some(a => a.id === api['id']));
      return that.$filter('filter')(apisFound, searchText);
    } else {
      return this.ApiService.list()
        .then(function (response) {
          // Map the response object to the data object.
          let apis = response.data;
          that.allApis = apis;
          let apisFound = _.filter(apis, api => !that.selectedAPIs.some(a => a.id === api['id']));
          return that.$filter('filter')(apisFound, searchText);
        });
    }
  }

  selectedApiChange(api) {
    if (api) {
      this.ApiService.get(api.id).then(response => {
        this.addedAPIs.push(response.data);
        this.selectedAPIs.push(response.data);
      });
    }
    this.searchText = "";
    this.formChanged = true;
    setTimeout(function () {
      document.getElementById('new-view-apis-autocomplete-id').blur();
    },0);
  }

  removeApi(api) {
    this.$mdDialog.show({
      controller: 'DeleteAPIViewDialogController',
      template: require('./delete-api-view.dialog.html'),
      locals: {
        api: api
      }
    }).then((deleteApi) => {
      if (deleteApi) {
        if (this.viewApis && this.viewApis.some(a => a.id === api.id)) {
          // we need to retrieve the API to get the all information required for the update
          this.ApiService.get(api.id).then(response => {
            let apiFound = response.data;
            _.remove(apiFound.views, (v) => v === this.view.key);
            this.ApiService.update(apiFound).then(() => {
              this.NotificationService.show("API '" + api.name + "' detached with success");
              _.remove(this.selectedAPIs, api);
              _.remove(this.viewApis, api);
            });
          });
        } else {
          _.remove(this.selectedAPIs, api);
        }
      }
    });
  }

  toggleHighlightAPI(api) {
    this.view.highlightApi = api.id;
    this.viewForm.$setDirty();
  }

  toggleVisibility() {
    this.view.hidden = !this.view.hidden;
    this.formChanged = true;
  }

  isHighlightApi(api) {
    return this.view && this.view.highlightApi === api.id;
  }

  getApis() {
    return this.selectedAPIs;
  }
}

export default ViewController;
