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
class PolicyService {
  private policiesURL: string;

  constructor(private $http, Constants) {
    'ngInject';
    this.policiesURL = `${Constants.baseURL}policies/`;
  }

  list() {
    let url = this.policiesURL;
/*    if(expandSchema) {
      url += "?expand=schema";
    }*/
    return this.$http.get(url);
  }

  listSwaggerPolicies() {
    return this.$http.get(this.policiesURL + "swagger");
  }

  getSchema(policyId) {
    return this.$http.get(this.policiesURL + policyId + '/schema');
  }
}

export default PolicyService;
