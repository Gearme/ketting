import { State } from './state';
import * as qs from 'querystring';
import Client from './client';

/**
 * An action represents a hypermedia form submission or action.
 */
export interface Action<T> {

  /**
   * Execute the action or submit the form.
   */
  submit(formData: T): Promise<State>;

}

export class SimpleAction<TFormData> {

  constructor(public client: Client, public method: string, public href:string, public type: string) {

  }

  /**
   * Execute the action or submit the form.
   */
  async submit(formData: TFormData): Promise<State<any>> {

    const method = this.method || 'GET';
    const type = this.type || 'application/x-www-form-urlencoded';

    const uri = new URL(this.href);

    if (method === 'GET') {
      uri.search = qs.stringify(formData);
      const resource = this.client.go(uri.toString());
      return resource.get();
    }
    let body;
    switch (type) {
      case 'application/x-www-form-urlencoded' :
        body = qs.stringify(formData);
        break;
      case 'application/json':
        body = JSON.stringify(formData);
        break;
      default :
        throw new Error(`Serializing mimetype ${type} is not yet supported in actions`);
    }
    const response = await this.client.fetcher.fetchOrThrow(uri.toString(), {
      method,
      body,
      headers: {
        'Content-Type': type
      }
    });
    const state = this.client.getStateForResponse(uri.toString(), response);
    return state;

  }
}

export class ActionNotFound extends Error {}
