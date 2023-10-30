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
import DashboardService from "../../../services/dashboard.service";
import * as _ from "lodash";
const WidgetChartLineConfigurationComponent: ng.IComponentOptions = {
  template: require('./widget-chart-line-configuration.html'),
  bindings: {
    chart: '<'
  },
  controller: function (DashboardService: DashboardService) {
    'ngInject';
    this.fields = DashboardService.getAggregateFields();

    this.$onInit = () => {
      this.data = [];
      if (this.chart.request) {
        if (this.chart.request.aggs) {
          this.data = this.chart.request.aggs.split('%3B');
        }
      } else {
        _.merge(this.chart, {
          request: {
            type: 'date_histo',
            aggs: ''
          },
          labels: []
        });
      }
    };

    this.onDataChanged = () => {
      this.chart.request.aggs = '';
      this.chart.labels = [];
      let last = _.last(this.data);
      _.forEach(this.data, (data) => {
        this.chart.request.aggs += data + (last === data ? '' : '%3B');
        //@ts-nocheck
        const field: {label: string} = _.find(this.fields, {aggValue: data})
        if(field && !!field.label) {
          this.chart.labels.push(field.label);
        }
      });
    };
  }
};

export default WidgetChartLineConfigurationComponent;
