## Legacy projects - use cases and available features

1. Full transition user (bring in all spatial data, `pu.shp`; input and output
   data folders)

2. Partial transition user: `pu.shp` and/or input/output data folders (`pu.shp`
   is essential)

   a. May want to create new scenarios and re-run marxan

   b. Just show the features (via `puvspr.dat`), targets, costs and solutions
      and not re-run Marxan

   c. Just bring in the `pu.shp` with solutions in the attribute table to view
      solutions on the map

## Choices when uploading a legacy project

1. If users wish to upload a legacy project (rather than an exported MarxanCloud
   archive), they are given the option to upload five different kinds of data
   (each should have info buttons).

   a. Upload a planning unit shapefile (this *must* be provided)

   b. Upload all the required input files (required)

   c. Upload output data files produced by running Marxan outside of the
      platform (optional)

   d. Upload feature data as shapefiles (optional)

   e. Upload cost surface data as shapefile (optional)

2. If users choose to upload output data, they should also be given the option
   to _lock_ these results calculated outside of the Marxan MaPP platform:
   re-running Marxan on such imported scenarios should be disallowed.

## Functionality available depending on data supplied by the user

### When uploading planning unit grid and input db (a+b)

This may be the case when users are transitioning a legacy project to the Marxan
MaPP platform (rather than making it available as an historical archive, for
example).

The following limitations will apply:

- users will not be able to add, remove or combine (split/stratification)
  features;
- the exact spatial distribution of features will not be available for display;
- planning unit lock status will be set from input `pu.dat`, but without first
  adding spatial data for protected areas, users won't be able to rely on
  protected areas to set the default lock status of planning units.

### When uploading planning unit grid, input db and output db (a+b+c)

This may be the case when users intend to upload a historical project to be
shared in its archived state.

- identical limitations to what was described in the previous use case will
  apply (in case users wish to continue working on the project within the Marxan
  MaPP platform);
- output data may be locked (i.e. running Marxan will be disallowed) if the user
  wishes to preserve a historical record of solutions calculated outside of the
  Marxan MaPP platform.

## When uploading planning unit grid, input db, output db and feature data (a+b+c+d+e)

This may be the case when users intend to transition to using Marxan MaPP for an
existing project for which extensive source data is available; they may wish to
showcase an historical record of the project as created outside of Marxan MaPP
(by keeping the original output solutions intact), while working on a copy of
the original project as a new scenario or set of scenarios, adding any further
spatial data directly within the Marxan MaPP platform.

With the data supplied at project import stage, some limitations will still
apply (for example, default lock status from protected areas, until a protected
area shapefile is uploaded in a cloned scenario) but the imported legacy project
will largely be functional like a native Marxan MaPP project.

### When uploading planning unit grid and output db (a+c)

**This combination is _not_ supported in the current version of the MarxanCloud
platform. Input files are _always_ required.**

In this use case, no further editing of the imported project will
be allowed, and it won't be possible to create new scenarios from the imported
base data.

Most of the steps/tabs of the Marxan MaPP workflow will be unavailable, as will
some of the maps where no suitable data is available to plot them.

The project's solutions will be available as an archived historical artifact for
reference.

### When importing planning unit grid, output db, all feature data and cost surface data (a+c+d+e)

**This combination is _not_ supported in the current version of the MarxanCloud
platform. Input files are _always_ required.**

In this use case, for example users may wish to showcase an archived historical
project. No further editing of the imported project will be allowed and it won't
be possible to create new scenarios from the imported base data.

Without input data files, some of the maps may be unavailable where no suitable
data is available to plot them (for example, planning unit lock status,
protected areas...).
