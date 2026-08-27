import { crudFactory } from "./crudFactory.js";

export default crudFactory("projects", {
  useSlug: true,
  publicFilter: (item) => item.published !== false,
});
