# Gadget Development

This is a Development-Environment for easily building a Jira-Gadget without the need of knowing all to much
of the underlying JIRA-Plugin architecture.

This Environment is based on Gulp to package all necessary Files and put them where they belong in the JIRA-Gadget-Folder.
Furthermore, Gulp can watch all Files for changes and automatically repackage the whole app so all you need to do to view your changes is reload JIRA in the Browser.


# Dependencies

- *Atlassian Plugin SDK* : [Click for Installation Manual](https://developer.atlassian.com/docs/getting-started/set-up-the-atlassian-plugin-sdk-and-build-a-project)
- [*NodeJS*](http://www.nodejs.org/) - We need this for the gulp-task-runner.
- [*Gulp*](http://gulpjs.com/) - After installing NodeJS, you can easily install Gulp via the command line: **npm install -g gulp**
- [*Bower*](http://bower.io/) - **npm install -g bower**


# Installation
============
From a CMD-Terminal execute the following commands:

- **cd gadgetDev**  --> *Change Directory into this Dev-Dir*
- **npm install**   --> *Installs all of Gulps Dependencies*
- **bower install** --> *Installs all Frontend-Dependencies*
- **gulp serve**    --> *Start Developing!*

Gulp will now automatically build all resources and put them into the right directory under **src/main/ressources/**.
It will also watch all files for any changes and execute the belonging compile-task again so you can develop without needing
to restart anything.

# Usage of templates
==================
Right now, all templates will be added to the Namespace **window.timeCollector.templates** and can be executed from there.


# Gulp tasks
==========
Gulp will concat and minify all JS-Files into a single File **timeCollector.js** and put that file into **src/main/ressources/js/**.
The same goes for Bower-Files (**timeCollectorVendor.js**).
Handlebar-Templates will be pre-compiled and put into the same folder as **timeCollectorTemplates.js**.
CSS will just be concatenated and put into **src/main/ressources/css/**.
