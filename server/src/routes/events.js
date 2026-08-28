import { crudFactory } from "./crudFactory.js";

// Public visitors only ever see published events.
export default crudFactory("events", {
  useSlug: true,
  publicMatch: { published: true },
});
