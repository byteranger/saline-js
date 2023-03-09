# Salt Api Client

## API

### SaltAPI(url, init)

- url
- init
  - token : string : default = null
  - tokenExpire : date : default = null
  - tokenRefreshTimer : number/TimeoutID : default = null
  - tokenAutoRefresh : boolean : default = false
  - waitTries : number : default = 3
  - waitSeconds : number : default = 10
  - debug : boolean : default = false

## Examples

### Wait example

Will sleep minion for random 0-30 seconds and poll api for results.

Promise:

	salt.start('*', 'cmd.run', ['sleep $(($RANDOM % 30))'], {shell:'/bin/bash'})
		.then(function (job) {return salt.wait(job.jid)})
		.then(console.log)
		.catch(console.error);

Async/Await:

	async function example() {
		try {
			let job = await salt.start('*', 'cmd.run', ['sleep $(($RANDOM % 30))'], {shell:'/bin/bash'});
			let result = await salt.wait(job.jid);
			console.log(result);
		} catch (e) {
			console.error(e);
		}
	}
