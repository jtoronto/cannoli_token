import React, { Component } from "react";
import CannoliToken from "./contracts/CannoliToken.json";
import CannoliTokenSale from "./contracts/CannoliTokenSale.json";
import KycContract from "./contracts/KycContract.json";
import getWeb3 from "./getWeb3";
import cannoliImg from "./cannoli.jpeg";

import "./App.css";

class App extends Component {
  state = { loaded:false, kycAddress: "0x123...", tokenSaleAddress: null, userTokens:0, totalSupply:0, requestedTokens:0 };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the contract instance.
      this.networkId = await this.web3.eth.net.getId();
    
      this.tokenInstance = new this.web3.eth.Contract(
        CannoliToken.abi,
        CannoliToken.networks[this.networkId] && CannoliToken.networks[this.networkId].address,
      );

      this.tokenSaleInstance = new this.web3.eth.Contract(
        CannoliTokenSale.abi,
        CannoliTokenSale.networks[this.networkId] && CannoliTokenSale.networks[this.networkId].address,
      );
      this.kycInstance = new this.web3.eth.Contract(
        KycContract.abi,
        KycContract.networks[this.networkId] && KycContract.networks[this.networkId].address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.listenToTokenTransfer();
      this.setState({loaded:true, tokenSaleAddress:CannoliTokenSale.networks[this.networkId].address}, this.updateUserTokens);
      this.updateTotalSupply();
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  updateUserTokens = async () => {
    let userTokens = await this.tokenInstance.methods.balanceOf(this.accounts[0]).call();
    this.setState({userTokens: userTokens});
  }

  updateTotalSupply = async () =>{
    let _totalSupply = await this.tokenInstance.methods.totalSupply().call();
    this.setState({totalSupply: _totalSupply});
  }

  requestedTokensHandleChange = (event) => {
    this.setState({requestedTokens: event.target.value})
  }

  listenToTokenTransfer = () => {
    this.tokenInstance.events.Transfer({to: this.accounts[0]}).on("data",this.updateUserTokens);
    this.tokenInstance.events.Transfer({to: this.accounts[0]}).on("data",this.updateTotalSupply);
  }

  handleBuyTokens = async() => {
    await this.tokenSaleInstance.methods.buyTokens(this.accounts[0]).send({from: this.accounts[0], value: this.web3.utils.toWei(this.state.requestedTokens,"wei")});
  }

  handleInputChange = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({
      [name]: value
    });
  }

  handleKycWhitelisting = async () => {
    await this.kycInstance.methods.setKycCompleted(this.state.kycAddress).send({from: this.accounts[0]});
    alert("KYC for "+this.state.kycAddress+" is completed");
  }

  render() {
    if (!this.state.loaded) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
     
      <div className="App">
        <img src={cannoliImg}></img>
        <h1>JT's Cannoli Token Sale</h1>
        <h3>Leave the wei, take the cannoli.</h3>
        <h2>Kyc Whitelisting</h2>
        Address to allow: <input type="text" name="kycAddress" value={this.state.kycAddress} onChange={this.handleInputChange} />
        <button type="button" onClick={this.handleKycWhitelisting}>Add to Whitelist</button>
        <h2>Buy Tokens</h2>
        <p>If you want to buy tokens, send Wei to this address: {this.state.tokenSaleAddress}</p>
        <p>You currently have: {this.state.userTokens} CNLI Tokens</p>
        Buy <input type="text" value={this.state.requestedTokens} onChange={this.requestedTokensHandleChange}/> CNLI tokens <button type="button" onClick={this.handleBuyTokens}>Submit</button>
        <p>Current Total Supply:{this.state.totalSupply}</p>
      </div>
    );
  }
}

export default App;
