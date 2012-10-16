# bem server

`bem server` command runs a development server. It makes the project files being accessible via the http protocol.
This includes the files which are generated during the build process. So the server can be useful when you develop the
static pages using the bem method. You just edit the files, refresh the browser and get updated page. All the files
which are affected by your changes will be rebuilt automatically.
In the case your project has no static pages you can configure your backend server and production environment to retrieve
the stylesheets and scripts from the bem server. bem server accepts connections via normal TCP socket and via UNIX domain socket.

By default the current directory is considered as the project root. You can change it using the --project (-r) option.

Default TCP port is 8080. You can change it using the --port (-p) option.

When requested URL is mapped to a directory, the server will check if there is an index.html file or it's possible to build it.
In the case one of these is true the content of the file will be returned to browser. The directory content listing will be returned
otherwise.
