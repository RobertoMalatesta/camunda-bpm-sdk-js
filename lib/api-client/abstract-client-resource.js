'use strict';

// var HttpClient = require('./http-client');
var Events = require('./../events');
var BaseClass = require('./../base-class');


function noop() {}

/**
 * Abstract class for resources
 *
 * @class
 * @augments {CamSDK.BaseClass}
 * @memberof CamSDK.client
 *
 * @borrows CamSDK.Events.on                        as on
 * @borrows CamSDK.Events.once                      as once
 * @borrows CamSDK.Events.off                       as off
 * @borrows CamSDK.Events.trigger                   as trigger
 *
 * @borrows CamSDK.Events.on                        as prototype.on
 * @borrows CamSDK.Events.once                      as prototype.once
 * @borrows CamSDK.Events.off                       as prototype.off
 * @borrows CamSDK.Events.trigger                   as prototype.trigger
 *
 *
 * @example
 *
 * // create a resource Model
 * var Model = AbstractClientResource.extend({
 *   apiUri: 'path-to-the-endpoint'
 *   doSomethingOnInstance: function() {
 *     //
 *   }
 * }, {
 *   somethingStatic: {}
 * });
 *
 * // use the generated Model statically
 * // with events
 * Model.on('eventname', function(results) {
 *   // You probably have something like
 *   var total = results.count;
 *   var instances = results.items;
 * });
 * Model.list({ nameLike: '%call%' });
 *
 * // or alternatively by using a callback
 * Model.list({ nameLike: '%call%' }, function(err, results) {
 *   if (err) {
 *     throw err;
 *   }
 *
 *   var total = results.count;
 *   var instances = results.items;
 * });
 *
 * var instance = new Model();
 * instance.claim(function(err, result) {
 *
 * });
 */
var AbstractClientResource = BaseClass.extend(
/** @lends AbstractClientResource.prototype */
{
  /**
   * Initializes a AbstractClientResource instance
   *
   * This method is aimed to be overriden by other implementations
   * of the AbstractClientResource.
   *
   * @method initialize
   */
  initialize: function() {
    // do something to initialize the instance
    // like copying the Model http property to the "this" (instanciated)
    this.http = this.constructor.http;
  }
},


/** @lends AbstractClientResource */
{
  /**
   * Path used by the resource to perform HTTP queries
   *
   * @abstract
   * @memberOf CamSDK.client.AbstractClientResource
   */
  path: '',

  /**
   * Object hosting the methods for HTTP queries.
   *
   * @abstract
   * @memberof CamSDK.client.AbstractClientResource
   */
  http: {},



  /**
   * Create an instance on the backend
   *
   * @abstract
   * @memberOf CamSDK.client.AbstractClientResource
   *
   * @param  {!Object|Object[]}  attributes
   * @param  {requestCallback} [done]
   */
  create: function(attributes, done) {},


  /**
   * Fetch a list of instances
   *
   * @memberof CamSDK.client.AbstractClientResource
   *
   * @fires CamSDK.AbstractClientResource#error
   * @fires CamSDK.AbstractClientResource#loaded
   *
   * @param  {?Object.<String, String>} params
   * @param  {requestCallback} [done]
   */
  list: function(params, done) {
    // allows to pass only a callback
    if (typeof params === 'function') {
      done = params;
      params = {};
    }
    params = params || {};
    done = done || noop;

    // var likeExp = /Like$/;
    var self = this;
    var results = {
      count: 0,
      items: []
    };

    // until a new webservice is made available,
    // we need to perform 2 requests
    return this.http.get(this.path +'/count', {
      data: params,
      done: function(err, countRes) {
        if (err) {
          /**
           * @event CamSDK.AbstractClientResource#error
           * @type {Error}
           */
          self.trigger('error', err);
          return done(err);
        }

        results.count = countRes.count;

        self.http.get(self.path, {
          data: params,
          done: function(err, itemsRes) {
            if (err) {
              /**
               * @event CamSDK.AbstractClientResource#error
               * @type {Error}
               */
              self.trigger('error', err);
              return done(err);
            }

            results.items = itemsRes;
            // QUESTION: should we return that too?
            results.firstResult = parseInt(params.firstResult || 0, 10);
            results.maxResults = results.firstResult + parseInt(params.maxResults || 10, 10);


            /**
             * @event CamSDK.AbstractClientResource#loaded
             * @type {Object}
             * @property {Number} count is the total of items matching on backend
             * @property {Array} items  is an array of items
             */
            self.trigger('loaded', results);
            done(err, results);
          }
        });
      }
    });
  },



  /**
   * Update one or more instances
   *
   * @abstract
   * @memberof CamSDK.AbstractClientResource
   *
   * @param  {!String|String[]}     ids
   * @param  {Object.<String, *>}   attributes
   * @param  {requestCallback} [done]
   */
  update: function(ids, attributes, done) {},



  /**
   * Delete one or more instances
   *
   * @abstract
   * @memberof CamSDK.AbstractClientResource
   *
   * @param  {!String|String[]}  ids
   * @param  {requestCallback} [done]
   */
  delete: function(ids, done) {}
});


Events.attach(AbstractClientResource);

module.exports = AbstractClientResource;
