import { Observable } from '../observation/observable.js';
import { ElementStyles } from '../styles/element-styles.js';
import { AttributeDefinition } from './attributes.js';
import { $global } from '../platform.js';

const defaultShadowOptions = { mode: 'open' };
const defaultElementOptions = {};
const pppRegistry = $global.PPP.getById(4, () => {
  const typeToDefinition = new Map();

  return Object.freeze({
    register(definition) {
      if (typeToDefinition.has(definition.type)) {
        return false;
      }

      typeToDefinition.set(definition.type, definition);

      return true;
    },
    getByType(key) {
      return typeToDefinition.get(key);
    }
  });
});

/**
 * Defines metadata for a PPPElement.
 * @public
 */
export class PPPElementDefinition {
  /**
   * Creates an instance of PPPElementDefinition.
   * @param type - The type this definition is being created for.
   * @param nameOrConfig - The name of the element to define or a config object
   * that describes the element to define.
   */
  constructor(type, nameOrConfig = type.definition) {
    if (typeof nameOrConfig === 'string') {
      nameOrConfig = { name: nameOrConfig };
    }

    this.type = type;
    this.name = nameOrConfig.name;
    this.template = nameOrConfig.template;

    const attributes = AttributeDefinition.collect(
      type,
      nameOrConfig.attributes
    );
    const observedAttributes = new Array(attributes.length);
    const propertyLookup = {};
    const attributeLookup = {};

    for (let i = 0, ii = attributes.length; i < ii; ++i) {
      const current = attributes[i];

      observedAttributes[i] = current.attribute;
      propertyLookup[current.name] = current;
      attributeLookup[current.attribute] = current;
    }

    this.attributes = attributes;
    this.observedAttributes = observedAttributes;
    this.propertyLookup = propertyLookup;
    this.attributeLookup = attributeLookup;
    this.shadowOptions =
      nameOrConfig.shadowOptions === void 0
        ? defaultShadowOptions
        : nameOrConfig.shadowOptions === null
        ? void 0
        : Object.assign(
            Object.assign({}, defaultShadowOptions),
            nameOrConfig.shadowOptions
          );
    this.elementOptions =
      nameOrConfig.elementOptions === void 0
        ? defaultElementOptions
        : Object.assign(
            Object.assign({}, defaultElementOptions),
            nameOrConfig.elementOptions
          );
    this.styles =
      nameOrConfig.styles === void 0
        ? void 0
        : Array.isArray(nameOrConfig.styles)
        ? ElementStyles.create(nameOrConfig.styles)
        : nameOrConfig.styles instanceof ElementStyles
        ? nameOrConfig.styles
        : ElementStyles.create([nameOrConfig.styles]);
  }

  /**
   * Indicates if this element has been defined in at least one registry.
   */
  get isDefined() {
    return !!pppRegistry.getByType(this.type);
  }

  /**
   * Defines a custom element based on this definition.
   * @param registry - The element registry to define the element in.
   */
  define(registry = customElements) {
    const type = this.type;

    if (pppRegistry.register(this)) {
      const attributes = this.attributes;
      const proto = type.prototype;

      for (let i = 0, ii = attributes.length; i < ii; ++i) {
        Observable.defineProperty(proto, attributes[i]);
      }

      Reflect.defineProperty(type, 'observedAttributes', {
        value: this.observedAttributes,
        enumerable: true
      });
    }

    if (!registry.get(this.name)) {
      registry.define(this.name, type, this.elementOptions);
    }

    return this;
  }
}

/**
 * Gets the element definition associated with the specified type.
 * @param type - The custom element type to retrieve the definition for.
 */
PPPElementDefinition.forType = pppRegistry.getByType;
