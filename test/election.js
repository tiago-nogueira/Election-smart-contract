var Election = artifacts.require("./Election.sol");

contract("Election", function(accounts) {

	var electionInstance;

	it("sets phase 1", function() {
		return setPhase(1);
	});

	function setPhase(number) {
		return Election.deployed().then(instance => {
			electionInstance = instance;
			return instance.setPhase(number);
		}).then(receipt => electionInstance.phase()
		).then(phase => {
			assert.equal(phase, number, `phase ${number} started`);
		});
	}

	it("initializes with no candidates", function() {
		return Election.deployed().then(instance => {
			return instance.candidatesCount();
		}).then(candCount => {
			assert(candCount, 0, "initializes with no candidates");
		});
	});

	it("register a candidate", function() {
		return Election.deployed().then(instance => {
			electionInstance = instance;
			return electionInstance.registerCandidate("João", { from: accounts[0] });
		}).then(receipt => {
			return electionInstance.candidatesCount();
		}).then(candCount => {
			assert.equal(candCount, 1, "correct number of candidates");
			return electionInstance.strToBytes32("João");
		}).then(nameBytes32 => {
			return electionInstance.candidatesNames(nameBytes32);
		}).then(bool => {
			assert(bool, "candidate name recorded");
			return electionInstance.candidatesAddresses(accounts[0]);
		}).then(bool => {
			assert(bool, "candidate address recorded");
			return electionInstance.candidates(1);
		}).then(candidate => {
			assert.equal(candidate[0], 1, "candidate with correct id");
			assert.equal(candidate[1], "João", "candidate with correct name");
			assert.equal(candidate[2], 0, "candidate with correct vote count");
		});
	});

	it("register a voter", function() {
		return Election.deployed().then(function(instance) {
			electionInstance = instance;
			return electionInstance.registerVoter( { from: accounts[0] });
		}).then(function(receipt) {
			return electionInstance.registeredVoters(accounts[0]);
		}).then(function(registration) {
			assert(registration, "the voter is registered");
		})
	});

	it("register a second candidate", function() {
		return Election.deployed().then(instance => {
			electionInstance = instance;
			return electionInstance.registerCandidate("José", { from: accounts[1] });
		}).then(receipt => {
			return electionInstance.candidatesCount();
		}).then(candCount => {
			assert.equal(candCount, 2, "correct number of candidates");
			return electionInstance.strToBytes32("José");
		}).then(nameBytes32 => {
			return electionInstance.candidatesNames(nameBytes32);
		}).then(bool => {
			assert(bool, "candidate name recorded");
			return electionInstance.candidatesAddresses(accounts[1]);
		}).then(bool => {
			assert(bool, "candidate address recorded");
			return electionInstance.candidates(2);
		}).then(candidate => {
			assert.equal(candidate[0], 2, "candidate with correct id");
			assert.equal(candidate[1], "José", "candidate with correct name");
			assert.equal(candidate[2], 0, "candidate with correct vote count");
		});
	});

	it("throws an exception for double registration of a candidate address", function() {
		return Election.deployed().then(instance => {
			electionInstance = instance;
			return electionInstance.registerCandidate("Marcos", { from: accounts[0] });
		}).then(assert.fail).catch(error => {
			assert(error.message.indexOf("revert") >= 0, "error message must contain 'revert'");
			return electionInstance.candidatesCount();
		}).then(candCount => {
			assert.equal(candCount, 2, "correct number of candidates");
			return electionInstance.strToBytes32("Marcos");
		}).then(nameBytes32 => {
			return electionInstance.candidatesNames(nameBytes32);
		}).then(name => {
			assert(!name, "candidate inexistent");
		})
	});

	it("throws an exception for double registration of a candidate name", function() {
		return Election.deployed().then(instance => {
			electionInstance = instance;
			return electionInstance.registerCandidate("José", { from: accounts[2] });
		}).then(assert.fail).catch(error => {
			assert(error.message.indexOf("revert") >= 0, "error message must contain 'revert'");
			return electionInstance.candidatesCount();
		}).then(candCount => {
			assert.equal(candCount, 2, "correct number of candidates");
			return electionInstance.candidatesAddresses(accounts[2]);
		}).then(address => {
			assert(!address, "candidate inexistent");
		});
	});

	it("register a third candidate", function() {
		return Election.deployed().then(instance => {
			electionInstance = instance;
			return electionInstance.registerCandidate("Mateus", { from: accounts[2] });
		}).then(receipt => {
			return electionInstance.candidatesCount();
		}).then(candCount => {
			assert.equal(candCount, 3, "correct number of candidates");
			return electionInstance.strToBytes32("Mateus");
		}).then(nameBytes32 => {
			return electionInstance.candidatesNames(nameBytes32);
		}).then(bool => {
			assert(bool, "candidate name recorded");
			return electionInstance.candidatesAddresses(accounts[2]);
		}).then(bool => {
			assert(bool, "candidate address recorded");
			return electionInstance.candidates(3);
		}).then(candidate => {
			assert.equal(candidate[0], 3, "candidate with correct id");
			assert.equal(candidate[1], "Mateus", "candidate with correct name");
			assert.equal(candidate[2], 0, "candidate with correct vote count");
		});
	});


	it("sets phase 2", function() {
		return setPhase(2);
	});

	it("throws an exception for an unregistered voter trying to vote", function() {
		return Election.deployed().then(function(instance) {
			electionInstance = instance;
			candidateId = 1;
			return electionInstance.vote(candidateId, { from: accounts[1]});
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, "error message must contain 'revert'");
			return checkVoteCount(electionInstance, [0, 0, 0]);
		});
	});

	function checkVoteCount(electionInstance, votesArray) {
		return electionInstance.candidatesCount().then(candCount => {
			for (let i = 1; i <= candCount; i++) {
				electionInstance.candidates(i).then((candidate) => {
					assert.equal(candidate[2], votesArray[i - 1], 
						`candidate '${candidate[1]} did not receive any vote`);
				});
			}
		});
	}

	it("register a second voter", function() {
		return Election.deployed().then(function(instance) {
			electionInstance = instance;
			return electionInstance.registerVoter( { from: accounts[1] });
		}).then(function(receipt) {
			return electionInstance.registeredVoters(accounts[1]);
		}).then(function(registration) {
			assert(registration, "the voter is registered");
		})
	});

	it("register a third voter", function() {
		return Election.deployed().then(function(instance) {
			electionInstance = instance;
			return electionInstance.registerVoter( { from: accounts[2] });
		}).then(function(receipt) {
			return electionInstance.registeredVoters(accounts[2]);
		}).then(function(registration) {
			assert(registration, "the voter is registered");
		})
	});

	it("allows a voter to cast a vote", function() {
		return Election.deployed().then(function(instance) {
			electionInstance = instance;
			candidateId = 1;

/*			return electionInstance.registeredVoters(accounts[0]);
		}).then(bool => {
			console.log("voter registered? " + bool);
			return electionInstance.candidates(1);
		}).then(candidate => {
			console.log("candidate data:" + candidate);
//			return electionInstance.votingOpen();
//		}).then(bool => {
//			console.log("voting open? " + bool);

*/

			return electionInstance.vote(candidateId, {from: accounts[0] });
		}).then(function(receipt) {
			assert.equal(receipt.logs.length, 1, "an event was triggered");
			assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
			assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
			return electionInstance.alreadyVoted(accounts[0]);
		}).then(function(voted) {
			assert(voted, "the voter was marked as voted");
			return electionInstance.candidates(candidateId);
		}).then(function(candidate) {
			var voteCount = candidate[2];
			assert.equal(voteCount, 1, "increments the candidate's vote");
		})
	});

	it("throws an exception for invalid candidates", function() {
		return Election.deployed().then(function(instance) {
			electionInstance = instance;
			return electionInstance.vote(99, { from: accounts[1] });
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, "error message must contain 'revert'");
			return checkVoteCount(electionInstance, [1, 0, 0])
		});
	});

	it("throws an exception for double voting", function() {
		return Election.deployed().then(function(instance) {
			electionInstance = instance;
			candidateId = 2;
			electionInstance.vote(candidateId, { from: accounts[1] });
			return electionInstance.candidates(candidateId);
		}).then(function(candidate) {
			var voteCount = candidate[2];
			assert.equal(voteCount, 1, "accept first vote");
			//try to vote again
			return electionInstance.vote(candidateId, { from: accounts[1] });
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, "error message must contain 'revert'");
			return checkVoteCount(electionInstance, [1, 1, 0]);
		});
	});

	it("throws an exception for registering a candidate during voting phase", function() {
		return Election.deployed().then(instance => {
			electionInstance = instance;
			return electionInstance.registerCandidate("Lucas", { from: accounts[3] });
		}).then(assert.fail).catch(error => {
			assert(error.message.indexOf("revert") >= 0, "error message must contain 'revert'");
			return electionInstance.candidatesCount();
		}).then(count => {
			assert.equal(count, 3, "correct number of candidates");
			return electionInstance.strToBytes32("Lucas");
		}).then(nameBytes32 => {
			return electionInstance.candidatesNames(nameBytes32);
		}).then(bool => {
			assert(!bool, "candidate name not registered");
			return electionInstance.candidatesAddresses(accounts[3]);
		}).then(address => {
			assert(!address, "candidate address not registered");
		});
	});

	it("sets phase 3", function() {
		return setPhase(3);
	});

	it("throws an exception for registering a candidate after voting ends", function() {
		return Election.deployed().then(instance => {
			electionInstance = instance;
			return electionInstance.registerCandidate("Paulo", { from: accounts[4] });
		}).then(assert.fail).catch(error => {
			assert(error.message.indexOf("revert") >= 0, "error message must contain 'revert'");
			return electionInstance.candidatesCount();
		}).then(count => {
			assert.equal(count, 3, "correct number of candidates");
			return electionInstance.strToBytes32("Paulo");
		}).then(nameBytes32 => {
			return electionInstance.candidatesNames(nameBytes32);
		}).then(bool => {
			assert(!bool, "candidate name not registered");
			return electionInstance.candidatesAddresses(accounts[3]);
		}).then(bool => {
			assert(!bool, "candidate address not registered");
		});
	});

	it("throws an exception for registering a voter after voting ends", function() {
		return Election.deployed().then(instance => {
			electionInstance = instance;
			return electionInstance.registerVoter( { from: accounts[3] });
		}).then(assert.fail).catch(error => {
			assert(error.message.indexOf("revert") >= 0, "error message must contain 'revert'");
			return electionInstance.registeredVoters(accounts[3]);
		}).then(bool => {
			assert(!bool, "voter not registered");
		});
	});

	it("throws an exception for a registered voter trying to vote after election ends", function() {
		return Election.deployed().then(function(instance) {
			electionInstance = instance;
			candidateId = 1;
			return electionInstance.vote(candidateId, { from: accounts[2]});
		}).then(assert.fail).catch(function(error) {
			assert(error.message.indexOf('revert') >= 0, "error message must contain 'revert'");
			return checkVoteCount(electionInstance, [1, 1, 0]);
		});
	});
});