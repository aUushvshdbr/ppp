import { DOM } from '../dom.js';
import {
  calcSplices,
  newSplice,
  projectArraySplices
} from './array-change-records.js';
import { SubscriberSet } from './notifier.js';
import { Observable } from './observable.js';

let arrayObservationEnabled = false;

function adjustIndex(changeRecord, array) {
  let index = changeRecord.index;
  const arrayLength = array.length;

  if (index > arrayLength) {
    index = arrayLength - changeRecord.addedCount;
  } else if (index < 0) {
    index =
      arrayLength +
      changeRecord.removed.length +
      index -
      changeRecord.addedCount;
  }

  if (index < 0) {
    index = 0;
  }

  changeRecord.index = index;

  return changeRecord;
}

class ArrayObserver extends SubscriberSet {
  constructor(source) {
    super(source);
    this.oldCollection = void 0;
    this.splices = void 0;
    this.needsQueue = true;
    this.call = this.flush;
    Reflect.defineProperty(source, '$pppController', {
      value: this,
      enumerable: false
    });
  }

  subscribe(subscriber) {
    this.flush();
    super.subscribe(subscriber);
  }

  addSplice(splice) {
    if (this.splices === void 0) {
      this.splices = [splice];
    } else {
      this.splices.push(splice);
    }

    if (this.needsQueue) {
      this.needsQueue = false;
      DOM.queueUpdate(this);
    }
  }

  reset(oldCollection) {
    this.oldCollection = oldCollection;

    if (this.needsQueue) {
      this.needsQueue = false;
      DOM.queueUpdate(this);
    }
  }

  flush() {
    const splices = this.splices;
    const oldCollection = this.oldCollection;

    if (splices === void 0 && oldCollection === void 0) {
      return;
    }

    this.needsQueue = true;
    this.splices = void 0;
    this.oldCollection = void 0;

    const finalSplices =
      oldCollection === void 0
        ? projectArraySplices(this.source, splices)
        : calcSplices(
            this.source,
            0,
            this.source.length,
            oldCollection,
            0,
            oldCollection.length
          );

    this.notify(finalSplices);
  }
}

/* eslint-disable prefer-rest-params */
/**
 * Enables the array observation mechanism.
 * @remarks
 * Array observation is enabled automatically when using the
 * {@link RepeatDirective}, so calling this API manually is
 * not typically necessary.
 * @public
 */
export function enableArrayObservation() {
  if (arrayObservationEnabled) {
    return;
  }

  arrayObservationEnabled = true;
  Observable.setArrayObserverFactory((collection) => {
    return new ArrayObserver(collection);
  });

  const proto = Array.prototype;

  // Don't patch Array if it has already been patched
  // by another copy of fast-element.
  if (proto.$pppPatch) {
    return;
  }

  Reflect.defineProperty(proto, '$pppPatch', {
    value: 1,
    enumerable: false
  });

  const pop = proto.pop;
  const push = proto.push;
  const reverse = proto.reverse;
  const shift = proto.shift;
  const sort = proto.sort;
  const splice = proto.splice;
  const unshift = proto.unshift;

  proto.pop = function () {
    const notEmpty = this.length > 0;
    const methodCallResult = pop.apply(this, arguments);
    const o = this.$pppController;

    if (o !== void 0 && notEmpty) {
      o.addSplice(newSplice(this.length, [methodCallResult], 0));
    }

    return methodCallResult;
  };
  proto.push = function () {
    const methodCallResult = push.apply(this, arguments);
    const o = this.$pppController;

    if (o !== void 0) {
      o.addSplice(
        adjustIndex(
          newSplice(this.length - arguments.length, [], arguments.length),
          this
        )
      );
    }

    return methodCallResult;
  };
  proto.reverse = function () {
    let oldArray;
    const o = this.$pppController;

    if (o !== void 0) {
      o.flush();
      oldArray = this.slice();
    }

    const methodCallResult = reverse.apply(this, arguments);

    if (o !== void 0) {
      o.reset(oldArray);
    }

    return methodCallResult;
  };
  proto.shift = function () {
    const notEmpty = this.length > 0;
    const methodCallResult = shift.apply(this, arguments);
    const o = this.$pppController;

    if (o !== void 0 && notEmpty) {
      o.addSplice(newSplice(0, [methodCallResult], 0));
    }

    return methodCallResult;
  };
  proto.sort = function () {
    let oldArray;
    const o = this.$pppController;

    if (o !== void 0) {
      o.flush();
      oldArray = this.slice();
    }

    const methodCallResult = sort.apply(this, arguments);

    if (o !== void 0) {
      o.reset(oldArray);
    }

    return methodCallResult;
  };
  proto.splice = function () {
    const methodCallResult = splice.apply(this, arguments);
    const o = this.$pppController;

    if (o !== void 0) {
      o.addSplice(
        adjustIndex(
          newSplice(
            +arguments[0],
            methodCallResult,
            arguments.length > 2 ? arguments.length - 2 : 0
          ),
          this
        )
      );
    }

    return methodCallResult;
  };
  proto.unshift = function () {
    const methodCallResult = unshift.apply(this, arguments);
    const o = this.$pppController;

    if (o !== void 0) {
      o.addSplice(adjustIndex(newSplice(0, [], arguments.length), this));
    }

    return methodCallResult;
  };
}

/* eslint-enable prefer-rest-params */
