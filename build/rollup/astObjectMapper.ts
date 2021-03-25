import type {
  ObjectExpression,
  BaseNode,
  ArrayExpression,
  Property,
  Identifier,
  Expression,
  SpreadElement,
} from "estree";

const arrayMapper = (node: ArrayExpression, object: any) => {
  node.elements.map((element: Expression | SpreadElement) => {
    if (element.type === "Literal") {
      object.push(element.value);
      return;
    }
    if (element.type === "ObjectExpression") {
      const obj = {};
      astObjectMapper(obj)(element);
      object.push(obj);
      return;
    }

    if (element.type === "ArrayExpression") {
      const arr: any[] = [];
      astObjectMapper(arr)(element);
      object.push(arr);
      return;
    }
  });
};

const objectMapper = (node: ObjectExpression, object: any) => {
  node.properties.forEach((prop: Property) => {
    const key = prop.key as Identifier;
    if (prop.value.type === "Literal") {
      object[key.name] = prop.value.value;
      return;
    }

    if (prop.value.type === "ObjectExpression") {
      const obj = {};
      astObjectMapper(obj)(prop.value);
      object[key.name] = obj;
      return;
    }

    if (prop.value.type === "ArrayExpression") {
      const array: any[] = [];
      astObjectMapper(array)(prop.value);
      object[key.name] = array;
    }
  });
};

const astObjectMapper = (object: any[] | object) => (node: BaseNode) => {
  switch (node.type) {
    case "ArrayExpression":
      arrayMapper(node as ArrayExpression, object);
      break;
    case "ObjectExpression":
      objectMapper(node as ObjectExpression, object);
      break;
    default:
      console.warn("unknown object in runtimeConfig: ", node.type);
      break;
  }
};

export default astObjectMapper;
