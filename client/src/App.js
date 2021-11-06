import React, { Component } from "react";
import AuctionContract from "./contracts/Auction.json";
import getWeb3 from "./getWeb3";
import moment from "moment"

import "./App.css";

class Nftnode extends Component {
  render() {
    const {node} = this.props
    return (
      <div className="nftnode">
        <div>tokenid: {node.tokenid}</div>
        <div>URI: {node.uri}</div>
      </div>
    )
  }
}

class App extends Component {
  state = { storageValue: 0, web3: null, accounts: null, contract: null, my_nft_list:null, claim: [], auction: [], trans: [] };

  text1 = React.createRef()
  text2 = React.createRef()
  text3 = React.createRef()
  time1 = React.createRef()
  time2 = React.createRef()
  bidprice  = React.createRef()
  bidtoken = React.createRef()

  makeNft = async () => {
    let addressa = this.state.accounts[0]
    let date = Date.parse(new Date())/1000
    let uri = this.text1.current.value
    try {
      await this.state.contract.methods.mint(addressa, uri, date).send({from: addressa}).then((transaction) => {
        console.log(transaction)
      })
      alert('铸造完毕')
    }
    catch(e) {
      alert('铸造失败')
    }
  }

  showmyNFT = async () => {
    let addressa = this.state.accounts[0]
    await this.state.contract.methods.showMyNFT(addressa).call({from: addressa}).then((mynft) => {
      var output = []
      if(mynft.length !== 0 ){
        for( var i=0;i<mynft.length;i++ ){
          if(mynft[i].tokenid != 0){
            output.push(mynft[i])
          }
        }
        if(output.length != 0){
          this.setState({my_nft_list: output})
        }
        else{
          this.setState({my_nft_list: []})
        }
      }
      else{
        console.log(output)
        this.setState({my_nft_list: []})
      }
    })
    this.forceUpdate()
  }

  refreshAuc = async () => {
    let addressa = this.state.accounts[0]
    var myauction = []
    var date = Date.parse(new Date())/1000
    await this.state.contract.methods.showAuction(date).call({from: addressa}).then((allauction) => {
      if(allauction.length == 0 || allauction[0].tokenid == 0){
        allauction = []
      }
      for( var i=0; i<allauction.length; i++ ){
        if(allauction[i].tokenid != 0){
          myauction.push(allauction[i])
          myauction[i].begin_time = moment(myauction[i].begin_time*1000).format("YYYY-MM-DD HH:mm:ss")
          myauction[i].end_time = moment(myauction[i].end_time*1000).format("YYYY-MM-DD HH:mm:ss")
        }
        else{
          break;
        }
      }
      console.log(myauction)
      this.setState({auction: myauction, trans:[]})
    })
  }

  beginAuc = async () => {
    let date = Date.parse(new Date())/1000
    let addressa = this.state.accounts[0]
    var text2 = parseInt(this.text2.current.value)
    var text3 = parseInt(this.text3.current.value)
    let time1 = this.time1.current.value
    let time2 = this.time2.current.value
    var date1 = new Date(time1)
    var date2 = new Date(time2)
    var timestamp1 = Date.parse(date1)/1000
    var timestamp2 = Date.parse(date2)/1000
    console.log("start price:"+ text3)
    console.log("begin time:"+timestamp1)
    console.log("end time:"+timestamp2)
    await this.state.contract.methods.beginAuction(timestamp1, timestamp2, text2, text3, addressa, date).send({from:addressa}).then((error) => {
      console.log(error)
    })
  }

  bid = async () => {
    let date = Date.parse(new Date())/1000
    let addressa = this.state.accounts[0]
    var bidprice = this.bidprice.current.value
    var bidtoken = this.bidtoken.current.value
    try{
      await this.state.contract.methods.bid(addressa, bidtoken, date).send({from: addressa, value: bidprice}).then((error) => {
        alert('竞价成功！')
      })
    }
    catch(e) {
      var mes = e.message.substr(49,)
      mes = mes.substring(0,mes.length-1)
      var json = JSON.parse(mes);
      alert(json.value.data.message)
    }
  }

  claim = async () => {
    let addressa = this.state.accounts[0]
    var claim = []
    var date = Date.parse(new Date())/1000
    await this.state.contract.methods.showClaim(addressa, date).call().then((myclaim) => {
      if(myclaim[0]==0){
        myclaim=[]
      }
      console.log(myclaim)
      for( var i=0; i<myclaim.length; i++ ){
        if(myclaim[i] != 0){
          claim.push(myclaim[i])
        }
        else{
          break
        }
      }
      console.log(claim)
      this.setState({claim: claim})
    })
  }

  okclaim = async (value) => {
    let addressa = this.state.accounts[0]
    var date = Date.parse(new Date())/1000
    console.log("value:"+value)
    console.log(addressa)
    await this.state.contract.methods.claim(value, date).send({from: addressa, value: 10000000000000000}).then(console.log)
  }

  showTrans = async (tokenid) => {
    let addressa = this.state.accounts[0]
    await this.state.contract.methods.showTransmission(tokenid).call({from: addressa}).then((_address) => {
      if(_address[0] != 0){
        this.setState({trans: _address})
        console.log(_address)
      }
    })
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = AuctionContract.networks[networkId];
      const instance = new web3.eth.Contract(
        AuctionContract.abi,
        deployedNetwork && deployedNetwork.address,
      );
      console.log(web3.eth.defaultAccount)
      web3.eth.defaultAccount = accounts[0]
      console.log(web3.eth.defaultAccount)
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }

    if(!this.state.my_nft_list || this.state.my_nft_list.length==0){
        return (
            <div className="App">
              <div className="mynft">
                <div className="header-empty"></div>
                <div className="nft">NFT交易中心</div>
              </div>
              <div>
                <div className="aut-region">拍卖区</div>
                <button className="refresh_auc" onClick={this.refreshAuc}>刷新</button>
                <div className="show_aut">{ this.state.auction.map((value) => {
                  return (
                    <div>
                      <div>tokenid: {value.tokenid}</div>
                      <div>uri: {value.uri}</div>
                      <div>开始时间：{value.begin_time}</div>
                      <div>结束时间：{value.end_time}</div>
                      <div>当前价格：{value.current_price}</div>
                      <div>出价者：{value.highest_bidder}</div>
                      <button onClick={() => this.showTrans(value.tokenid)} >点击查看历史流转情况</button>
                      <div>{ this.state.trans.map((value) => {
                        return (
                            <div>{value}</div>
                        )
                      }) }</div>
                    </div>
                  )
                }) }</div>
              </div>
              <hr/>
              <div>
                <button className="make" onClick={this.makeNft}>铸造NFT</button>
                <input type="text" ref={this.text1} placeholder="Please input the URI."></input>
              </div>
              <div className="empty_1"></div>
              <hr/>
            <button className="show_my" onClick={this.showmyNFT}>点击查看我的NFT</button>
              <div>nothing</div>
              <hr/>
            <div>
                <div className="begin_auc">发起拍卖</div>
                <label>请输入token id：</label>
                <input type="textbox" ref={this.text2}></input>
                <br/>
                <label>请输入起拍价(wei)：</label>
                <input type="textbox" ref={this.text3}></input>
                <br/>
                <label>请设置拍卖起始时间</label>
              <input type="datetime-local" ref={this.time1} />
              <br/>
              <label>请设置拍卖结束时间</label>
              <input type="datetime-local" ref={this.time2} />
              <br/>
                <button onClick={this.beginAuc}>确认</button>
            </div>
              <hr/>
            <div>
              <div className="bid">出价</div>
              <label>请输入价格：</label>
              <input type="text" ref={this.bidprice} />
              <br/>
              <label>请输入token id：</label>
              <input type="text" ref={this.bidtoken} />
              <br/>
              <button onClick={this.bid} >确认</button>
            </div>
              <hr/>
            <div>
              <button className="claim" onClick={this.claim}>点击查看成功拍下的竞拍品</button>
              <div>{ this.state.claim.map((value) => {
                return (
                  <div className="claimnode">
                    <div>tokenid: {value}</div>
                    <button key={value} onClick={() => this.okclaim(value)}>确认</button>
                  </div>
                )
              }) }</div>
            </div>
            <div className="footer">Copyright@ZYNM2021</div>
          </div>
          
        );
      }
        return (
          <div className="App">
            <div className="mynft">
              <div className="header-empty"></div>
              <div className="nft">NFT交易中心</div>
            </div>
            <div>
                <div className="aut-region">拍卖区</div>
                <button className="refresh_auc" onClick={this.refreshAuc}>刷新</button>
                <div className="show_aut">{ this.state.auction.map((value) => {
                  return (
                    <div>
                      <div>tokenid: {value.tokenid}</div>
                      <div>uri: {value.uri}</div>
                      <div>开始时间：{value.begin_time}</div>
                      <div>结束时间：{value.end_time}</div>
                      <div>当前价格：{value.current_price}</div>
                      <div>出价者：{value.highest_bidder}</div>
                      <button onClick={() => this.showTrans(value.tokenid)} >点击查看历史流转情况</button>
                      <div>{ this.state.trans.map((value) => {
                        return (
                            <div>{value}</div>
                        )
                      }) }</div>
                    </div>
                  )
                }) }</div>
              </div>
              <hr/>
              <div>
                <button className="make" onClick={this.makeNft}>铸造NFT</button>
                <input type="text" ref={this.text1} placeholder="Please input the URI."></input>
              </div>
              <div className="empty_1"></div>
              <hr/>
            <button className="show_my" onClick={this.showmyNFT}>点击查看我的NFT</button>
            <div className="show_my_nft">{this.state.my_nft_list.map((value, index)=> <Nftnode key={index} node={value} /> )}</div>
            <hr/>
            <div>
              <div className="begin_auc">发起拍卖</div>
              <label>请输入token id：</label>
              <input type="textbox" ref={this.text2}></input>
              <br/>
              <label>请输入起拍价(wei)：</label>
              <input type="textbox" ref={this.text3}></input>
              <br/>
              <label>请设置拍卖起始时间</label>
              <input type="datetime-local" ref={this.time1} />
              <br/>
              <label>请设置拍卖结束时间</label>
              <input type="datetime-local" ref={this.time2} />
              <br/>
              <button onClick={this.beginAuc}>确认</button>
            </div>
              <hr/>
            <div>
              <div className="bid">出价</div>
              <label>请输入价格：</label>
              <input type="text" ref={this.bidprice} />
              <br/>
              <label>请输入token id：</label>
              <input type="text" ref={this.bidtoken} />
              <br/>
              <button onClick={this.bid} >确认</button>
            </div>
              <hr/>
            <div>
              <button className="claim" onClick={this.claim}>点击查看成功拍下的竞拍品</button>
              <div>{ this.state.claim.map((value) => {
                return (
                  <div className="claimnode">
                    <div>tokenid: {value}</div>
                    <button key={value} onClick={() => this.okclaim(value)}>确认</button>
                  </div>
                )
              }) }</div>
            </div>
            <div className="footer">Copyright@ZYNM2021</div>
        </div>
        );
  
    }
    
  
}

export default App;
