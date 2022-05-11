import { createHmac } from "crypto";

export const jsx = (type, props, ...children) => {
  const apply = (node, fn, ...args) => (fn(node, ...args), node);
  const chainer = (v) => ({ append: (...a) => v.append(...a) || v });
  const applyStyles = (node, style = {}) => (
    Object.entries(style).forEach(([k, v]) => node.style.setProperty(k, v)),
    node
  );
  return typeof type === "function"
    ? type(props, children)
    : chainer(
        apply(
          apply(
            Object.assign(document.createElement(type), props || {}),
            (node, fn = (v) => v) =>
              typeof fn === "function" ? fn(node) : (fn.current = node),
            (props || {}).ref
          ),
          applyStyles,
          (props || {}).style
        )
      ).append(...children.flat().filter((v) => v !== false));
};

export const classs = (...args) =>
  args
    .flatMap((object) => {
      if (!object) return null;
      if (typeof object === "string") {
        return object;
      }
      return Object.entries(object).reduce(
        (str, [name, bool]) => (bool && name ? [...str, name] : str),
        []
      );
    })
    .filter((v) => v)
    .join(" ");

export const getHash = (v) =>
  createHmac("sha256", "").update(String(v)).digest("hex").slice(0, 5);
const styledStore = new Map();
export const styledGet = () =>
  [...styledStore.values()].filter((v) => v).join("\n");
export const createStyled =
  (render) =>
  (...props) => {
    const id = props.length === 1 ? props[0] : null;

    const transformer = (str, ...args) => {
      const from = str
        .map((e, i) => [e, args[i]])
        .flat()
        .join("");
      const hash = getHash(from);
      const className = `_${id ?? ""}_${hash}`;
      const result = render(`.${className}{${from}}`);
      styledStore.set(className, result);

      return className;
    };

    return id ? transformer : transformer(...props);
  };
export const styled = createStyled((v) => v);

const scriptStore = [new Map(), new Map()];
export const scriptedGlobals = (globals = {}) =>
  Object.entries(globals)
    .map(([k, v]) => [
      k,
      typeof v === "function" ? v.toString() : JSON.stringify(v),
    ])
    .map(([k, v]) => scriptStore[0].set(k, `const ${k} = ${v};`));
export const scriptedGet = () =>
  scriptStore
    .flatMap((d) => d.values())
    .map((d) => [...d])
    .flat()
    .join("\n");
export const scripted = (fn, ...args) => {
  const setFn = (fn) => {
    const id = `_${getHash(fn.toString())}`;
    scriptStore[1].set(id, `const fn${id} = ${fn.toString()};`);
    return id;
  };
  const id = setFn(fn);
  const argsStrArr = args.map((v) =>
    typeof v === "function" ? `fn${setFn(v)}` : JSON.stringify(v)
  );
  const argsId = getHash(argsStrArr);
  const elId = [id, argsId].join("_");
  scriptStore[1].set(
    elId,
    `document.querySelectorAll(".${elId}").forEach(${
      argsStrArr.length > 0
        ? `(n) => fn${id}(${["n", ...argsStrArr].join(", ")})`
        : `fn${id}`
    });`
  );
  return elId;
};
