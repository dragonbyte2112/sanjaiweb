import { crudFactory } from "./crudFactory.js";

export default crudFactory("projects", {
  useSlug: true,
  publicMatch: { published: true },
});
