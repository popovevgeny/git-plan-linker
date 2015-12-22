var
  http = require('http'),
	request = require('request'),
	_ = require('underscore'),
	createHandler = require('github-webhook-handler'),
	handler = createHandler({ path: '/webhook', secret: '12345678' }),
	actions = {
		oppened: 'opened',
		closed: 'closed'
	},
	options = {
		hostname: 'https://nebitech.plan.io',
		headers: {
			'X-Redmine-API-Key': '685160484af8c99ec7c461f69f3e98f6'
		}
	},
	projectsByName;

//region Handlers
handler.on('error', function (err) {
	console.error('Error:', err.message)
});

handler.on('push', function (event) {
	console.log('Received a push event for %s to %s',
				event.payload.repository.name,
				event.payload.ref);
});

handler.on('issues', function (event) {
	console.log('new issue with action', event.payload.action);
	if (event.payload.action === actions.oppened) {
		openIssue(event.payload);
	} else {
		closeIssue(event.payload);
	}
});
//endregion

//region Bootstrap
console.log('Configure server');
getProjects(runHooker);
//endregion

//region Functions
function getProjects(callback) {
	console.info('Retrieving list of projects');

	request.get(
		{
			url: options.hostname + '/projects.json',
			headers: options.headers
		},
		function (error, response, body) {
			if (response.statusCode == 200) {
				var data = JSON.parse(response.body);
				projectsByName = {};
				data.projects.forEach(function (project) {
					projectsByName[project.identifier] = project.id;
				});

				console.info('Projects: ', data.projects.length);

				if (typeof callback === 'function') {
					callback();
				}
			}
    });
}

function runHooker() {
	http
		.createServer(function (req, res) {
			handler(req, res, function (err) {
				res.statusCode = 404
				res.end('no such location');
			});
		})
		.listen(8883, function () {
			console.log('Server has been running on port number 8883');
		});
}

function openIssue(data) {
	var issue = {
		project_id: projectsByName[data.repository.name],
		subject: data.issue.title,
		description: data.issue.body
	};

	console.log(issue);

	request.post(
		{
			url: options.hostname + '/issues.json',
			headers: options.headers
		},
		issue,
		function (error, response, body) {
			console.log('Issue has been created');
    });
}

function closeIssue() {

}
//endregion