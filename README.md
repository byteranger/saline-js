#Salt Api Client

##API

###SaltAPI(url, init)

- url
- init
  - token
  - tokenExpire
  - tokenRefreshTimer
  - tokenAutoRefresh
  - waitTries
  - waitSeconds
  - debug

##Examples

###Wait example

Will sleep minion for random 0-30 seconds and poll api for results:

	salt.start('*', 'cmd.run', ['sleep $(($RANDOM % 30))'], {shell:'/bin/bash'}).then(function (job) {return salt.wait(job.jid)}).then(console.log).catch(console.error)

