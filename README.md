# Log Collection

This is a simple tool that allows pulling the N latest events from a log file. Results are returned in a descending order so, newest events appear on the top of the stack. It assumes that, within a file, events are separated by a single '\n' character at the end of each line.

This tool can be used in two ways:

* Through the REST API.
* Executing a script from the cmd.

### Build
This code was tested using node v12.18.3.

```bash
npm install
```

### REST API
One single endpoint is exposed in this API. Here are the details:

**GET /api/files/:filename**
Where filename is a file that is supposed to be stored under /var/log.

#### Optional parameters
* **filter** - a text that can be used to filter results.
* **n** - the number of events to display, 10 by default.

#### Response sample
```
Sat May 16 08:50:08.549716 2020] [include:warn] [pid 32208:tid 139785297434368] [client 10.10.0.16:53730] AH01374: mod_include: Options +Includes (or IncludesNoExec) wasn't set, INCLUDES filter removed: /contenten-US/job/cashier/J3H6GT5XWSCC7XZXX0N.html
Sat May 16 08:50:08.432509 2020] [rewrite:trace2] [pid 32208:tid 139785297434368] mod_rewrite.c(483): [client 10.10.0.16:53730] 10.10.0.16 - - [www.sample.com/sid#31a9f58][rid#7f221c073b50/initial] forcing '/contenten-US/job/cashier/J3H6GT5XWSCC7XZXX0N.html' to get passed through to next API URI-to-filename handler
Sat May 16 08:50:08.432503 2020] [rewrite:trace2] [pid 32208:tid 139785297434368] mod_rewrite.c(483): [client 10.10.0.16:53730] 10.10.0.16 - - [www.sample.com/sid#31a9f58][rid#7f221c073b50/initial] rewrite '/en-US/job/cashier/J3H6GT5XWSCC7XZXX0N' -> '/contenten-US/job/cashier/J3H6GT5XWSCC7XZXX0N.html'
Sat May 16 08:50:08.432498 2020] [rewrite:trace4] [pid 32208:tid 139785297434368] mod_rewrite.c(483): [client 10.10.0.16:53730] 10.10.0.16 - - [www.sample.com/sid#31a9f58][rid#7f221c073b50/initial] RewriteCond: input='/en-US/job/cashier/J3H6GT5XWSCC7XZXX0N' pattern='!^/contactSubmit' => matched
Sat May 16 08:50:08.432494 2020] [rewrite:trace4] [pid 32208:tid 139785297434368] mod_rewrite.c(483): [client 10.10.0.16:53730] 10.10.0.16 - - [www.sample.com/sid#31a9f58][rid#7f221c073b50/initial] RewriteCond: input='/en-US/job/cashier/J3H6GT5XWSCC7XZXX0N' pattern='!^/lib' => matched
```

#### Run the web application
```bash
node app.js
```
This will start a server on port 4000. After that, you can start to pull events from your logs at this URL: http://localhost:4000/api/files/<log-file>.

#### Response codes
* 200 - File found
* 404 - File not found
* 500 - If something goes wrong internally.

### Command line tool
This tools works similarly to the endpoint defined above but events are redirected to the stdout.
```bash
node tail.js -p /var/log/file.log
```
#### Arguments
**-p** - path to the file
**-n** - number of events to print
**-f** - a text to filter values

#### Example
```bash
node tail.js -p /var/log/file.log -n 100 -f trace4
```

### Implementation details
This application was meant to be used to pull events from huge log files, so performance has been on the radar since the begining.
As it's used to pull the latest N events from files, this app starts reading bytes bottom-up, in a stream fashion. Files are reads in chunks that are pushed into a stream. This allows piping the data so it can be transformed or simply written down.

The key player in this application, is the ```LogStream``` class, which is an implementation of Node's Readable class. It's capable of reading log files in reverse order and of emiting log entries (aka events) as soon as they are found.

```BasicFilter``` is a custom ```Transform``` that can be used to both filter events and limit the number of results.
