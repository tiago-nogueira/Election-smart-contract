App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  updateFlag: true,

  init: function() {
    return App.initWeb3();
  },

  initWeb3: async function() {
    if (window.ethereum) {
      // TODO: refactor conditional
      if (typeof web3 != 'undefined') {
        //If a web3 instance is already provided by Meta Mask
        App.web3Provider = web3.currentProvider;
        web3 = new Web3(web3.currentProvider);
      } else {
        //specify default instance if no web3 instance provided
        App.web3Provider = new Web3.providers.HttpProvider('htth://localhost:7545');
        web3 = new Web3(App.web3Provider);
      }
      await ethereum.enable();
      return App.initContract();
    }
  },

  initContract: function() {
    $.getJSON("Election.json", function(election) {
      //Instantiate a new truffle contract from the artifact
      App.contracts.Election = TruffleContract(election);
      //Connect provider to interact with contract
      App.contracts.Election.setProvider(App.web3Provider);

      App.listenForEvents();
      setTimeout(App.setTimers(), 2000);
      App.render();
    });
  },

  // Listen for events emited from the contract
  listenForEvents: function() {
    ["voterRegEvent", "candidateRegEvent", "votedEvent"].forEach(eventName => {
      App.contracts.Election.deployed().then(function(instance) {
        instance[eventName]({}, {
          fromBlock: 0,
          toBlock: 'latest'
        }).watch(function(error, event) {
          console.log("event triggered: " + eventName, event);
          // flag to reload the page
          App.updateFlag = true;
        });
      });
    });
  },

  setTimers: function() {
    App.contracts.Election.deployed().then(async (instance) => {
      electionInstance = instance;
      let regStart = await electionInstance.regStart().then(obj => obj.c[0]);
      let regDuration = await electionInstance.regDuration().then(obj => obj.c[0]);
      let votDuration = await electionInstance.votDuration().then(obj => obj.c[0]);
      let phase = await electionInstance.electionPhases();
      let remainingTime;

      let currentTime = Math.floor(Date.now() / 1000);
      phase = 1;
      if (phase == 1) {
        remainingTime = regStart + regDuration - currentTime;
        timer(phase, remainingTime);
      }
      else if (phase == 2) {
        remainingTime = regStart + regDuration + votDuration - currentTime;
        timer(phase, remainingTime);
      }
      else App.updateFlag = true;

      // sets and update the timer each second
      function timer (phase, remainingTime) {
        let timer = setInterval(() => {
          if (remainingTime <= 0) {
            App.updateFlag = true;
            remainingTime += votDuration;
            phase++;
            if (phase != 1 && phase != 2) clearInterval(timer);  
          }
          remainingTime--;        
          $("#timer").html(toTimeString(remainingTime));
        }, 1000);        
      }
      
      // check if need to update the screen
      setInterval(() => {
        if (App.updateFlag) {
          App.updateFlag = false;
          App.render();
        }
      }, 1000);
    });
    // take the time is seconds and returns a string in the format hh:mm:ss
    function toTimeString(time) {
      if (time <= 0) return "";
      let hours = Math.floor(time / 3600);
      let minutes = Math.floor((time % 3600) / 60);
      let seconds = time % 60;

      function padding(num) {
        if (num > 9) return num.toString();
        return "0" + num;
      }
      return [hours, minutes, seconds].map(num => padding(num)).join(":");
    }
  },

  render: function() {
    var electionInstance;

    var loader = $("#loader");
    var content = $("#content");
    var regVoter = $("#regVoter");
    var regCand = $("#regCand");
    var voteForm = $("#voteForm");
    var timerWrapper = $("#timerWrapper");

    //Load account data
    web3.eth.getCoinbase(function (err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your account: " + account);
      }
    });

    //Load contract data
    App.contracts.Election.deployed().then(async function(instance) {
      electionInstance = instance;
      let candidatesCount = await electionInstance.candidatesCount();

      var candidatesResults = $("#candidatesResults");
      candidatesResults.empty();

      var candidatesSelect = $('#candidatesSelect');
      candidatesSelect.empty();

      for (let i = 1; i <= candidatesCount; i++) {
        electionInstance.candidates(i).then(function(candidate) {
          var id = candidate[0];
          var name = candidate[1];
          var voteCount = candidate[2];

          // Render candidate vote count
          var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>";
          candidatesResults.append(candidateTemplate);

          // Render candidate ballot option
          var candidateOption = "<option value='" + id + "' >" + name + "</ option>";
          candidatesSelect.append(candidateOption);
        });
      }

      let phase, votRegistered, candRegistered, hasVoted;

      [phase, votRegistered, candRegistered, hasVoted] = await function () {
        let phase = electionInstance.electionPhases();
        let votRegistered = electionInstance.registeredVoters(App.account);
        let candRegistered = electionInstance.candidatesAddresses(App.account);
        let hasVoted = electionInstance.alreadyVoted(App.account);
        return [phase, votRegistered, candRegistered, hasVoted];   
      }();

      content.show();
      loader.hide();

      if (phase == 1) {
        if (votRegistered) regVoter.hide();
        else regVoter.show();

        if(candRegistered) regCand.hide();
        else regCand.show();

        voteForm.hide();
        timerWrapper.show();
        $("timerWrapper p").html("Time untill voting opens");

      }else if (phase == 2) {
        if (votRegistered) regVoter.hide();
        else regVoter.show();

        if (!votRegistered || hasVoted) voteForm.hide();
        else voteForm.show();

        regCand.hide();
        timerWrapper.show();
        $("timerWrapper p").html("Time untill voting ends");
        $("h3").html("Parcial results");

      } else {
        regVoter.hide();
        regCand.hide();
        voteForm.hide();
        timerWrapper.hide();
        $("h3").html("Final results");
      }
    }).catch(error => console.warn(error));
  },

  regVoter: function() {
    App.contracts.Election.deployed().then(function(instance) {
      return instance.registerVoter({ from: App.account });
    }).then(function(result) {
      // Wait for registration to update
      $("#content").hide();
      $("#loader").show();
    }).catch(err => console.log(err));
  },

  regCandidate: function() {
    let candName = $('#candName').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.registerCandidate(candName, { from: App.account });
    }).then(function(result) {
      // Wait for registration to update
      $("#content").hide();
      $("#loader").show();
    }).catch(err => console.log(err));
  },

  castVote: function() {
    var candidateId = $('#candidatesSelect').val();
    App.contracts.Election.deployed().then(function(instance) {
      return instance.vote(candidateId, { from: App.account });
    }).then(function(result) {
      // Wait for votes to update
      $("#content").hide();
      $("#loader").show();
    }).catch(function(err) {
      console.log(err);
    });
  },
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});