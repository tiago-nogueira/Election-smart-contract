pragma solidity 0.5.0;

contract Election {
	// model a candidate
	struct Candidate {
		uint id;
		string name;
		uint voteCount;
	}
	// store registered accounts
	mapping(address => bool) public registeredVoters;
	// store accounts that have voted
	mapping(address => bool) public alreadyVoted;
	// store candidates
	mapping(uint => Candidate) public candidates;
	// store candidates names
	mapping(bytes32 => bool) public candidatesNames;
	// store candidates addresses
	mapping(address => bool) public candidatesAddresses;
	// store candidates count
	uint public candidatesCount;
	// store registration start time
	uint public regStart = now;
	// store registration duration
	uint public regDuration = 2 * 60;
	// store voting start time
	uint public votStart = regStart + regDuration;
	// store duration of voting period
	uint public votDuration = 2 * 60;

	// candidate registration event
	event candidateRegEvent (
		uint indexed _candidateName
	);

	// voter registration event
	event voterRegEvent ();

	// voted event
	event votedEvent (
		uint indexed _candidateId
	);


	function electionPhases () public view returns (uint) {
		uint time = now;

		// registration phase
		if (time < votStart) return 1;

		// voting phase
		if (time >= votStart && time <= votStart + votDuration) return 2;

		// election ended
		return 3;
	}

	function registerCandidate (string calldata _name) external {
		// require that candidate registration is still open
		require(electionPhases() == 1);

		// require that address is not already registered
		require(!candidatesAddresses[msg.sender]);

		// converting from string to bytes32
		bytes32 _nameBytes32 = strToBytes32(_name);

		// require that name is not already used
		require(!candidatesNames[_nameBytes32]);

		candidatesCount ++;
		candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
		candidatesAddresses[msg.sender] = true;
		candidatesNames[_nameBytes32] = true;

		// trigger candidate registration event
		emit candidateRegEvent(candidatesCount);
	}

	function registerVoter () external {
		// require that voting is still open
		require(electionPhases() == 1 || electionPhases() == 2);

		// require that voter haven't already registered
		require(!registeredVoters[msg.sender]);

		// register the voter
		registeredVoters[msg.sender] = true;

		// trigger voter registration event
		emit voterRegEvent();
	}

	function vote (uint _candidateId) external {
		// require that voting is open
		require(electionPhases() == 2);

		// require that voter is registered
		require(registeredVoters[msg.sender]);

		// require that voter haven't voted before
		require(!alreadyVoted[msg.sender]);

		// require a valid candidate
		require(_candidateId > 0 && _candidateId <= candidatesCount);

		//record that voter has voted
		alreadyVoted[msg.sender] = true;

		//update candidate vote count
		candidates[_candidateId].voteCount ++;

		// trigger voted event
		emit votedEvent(_candidateId);
	}


    function strToBytes32(string memory _str) private pure returns (bytes32 result) {
	    bytes memory tempEmptyStringTest = bytes(_str);
	    if (tempEmptyStringTest.length == 0) {
	        return 0x0;
	    }

	    assembly {
	        result := mload(add(_str, 32))
	    }
	}




/*	for testing

	uint public phase;
	function setPhase (uint _phase) external {
		phase = _phase;
	}

	function registerCandidate (string calldata _name) external {
		// require that candidate registration is still open
		require(phase == 1);

		// require that address is not already registered
		require(!candidatesAddresses[msg.sender]);

		// converting from string to bytes32
		bytes32 _nameBytes32 = strToBytes32(_name);

		// require that name is not already used
		require(!candidatesNames[_nameBytes32]);

		candidatesCount ++;
		candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
		candidatesAddresses[msg.sender] = true;
		candidatesNames[_nameBytes32] = true;

		// trigger candidate registration event
		emit candidateRegEvent(candidatesCount);
	}

	function registerVoter () external {
		// require that voting is still open
		require(phase == 1 || phase == 2);

		// require that voter haven't already registered
		require(!registeredVoters[msg.sender]);

		// register the voter
		registeredVoters[msg.sender] = true;

		// trigger voter registration event
		emit voterRegEvent();
	}

	function vote (uint _candidateId) external {
		// require that voting is open
		require(phase == 2);

		// require that voter is registered
		require(registeredVoters[msg.sender]);

		// require that voter haven't voted before
		require(!alreadyVoted[msg.sender]);

		// require a valid candidate
		require(_candidateId > 0 && _candidateId <= candidatesCount);

		//record that voter has voted
		alreadyVoted[msg.sender] = true;

		//update candidate vote count
		candidates[_candidateId].voteCount ++;

		// trigger voted event
		emit votedEvent(_candidateId);
	}

    function strToBytes32(string memory _str) public pure returns (bytes32 result) {
	    bytes memory tempEmptyStringTest = bytes(_str);
	    if (tempEmptyStringTest.length == 0) {
	        return 0x0;
	    }

	    assembly {
	        result := mload(add(_str, 32))
	    }
	}
*/

}