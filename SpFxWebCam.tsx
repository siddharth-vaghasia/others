import * as React from 'react';
import styles from './SpFxWebCam.module.scss';
import { ISpFxWebCamProps } from './ISpFxWebCamProps';
import { escape } from '@microsoft/sp-lodash-subset';
import * as Webcam from "react-webcam";
import * as ReactDom from 'react-dom';
import { Button } from 'office-ui-fabric-react/lib/Button';
import { sp } from "@pnp/sp";

import { Placeholder } from "@pnp/spfx-controls-react/lib/Placeholder";
import { DisplayMode } from '@microsoft/sp-core-library';  
import { PrimaryButton, MessageBar, MessageBarType , Dialog ,DialogType,DialogFooter,DefaultButton} from 'office-ui-fabric-react';


export default class SpFxWebCam extends React.Component<ISpFxWebCamProps,{hideDialog: boolean,webcam:Webcam}> {

  private _camContainer: HTMLElement = undefined;
  private _capturedPhoto: HTMLElement = undefined;
  private _input:HTMLInputElement = undefined;
  public _messageContainer:HTMLElement = undefined;
  private imageSrc;
  

  constructor(props: ISpFxWebCamProps) {
    super(props);
    this.state = { hideDialog: true, webcam: null };
}

public render(): React.ReactElement<ISpFxWebCamProps> {
    
  /*return (
    <div className={ styles.maincontainer }>
      <input type="file" ref={(elm) => { this._input = elm; }}></input>
      <p>
      <button onClick={() => this.uploadFileFromControl()} >
                     Upload
                    </button>
                    </p>
    </div>
  
  );*/

    
    return (
      <div className={ styles.maincontainer }>
        <input type="file" ref={(elm) => { this._input = elm; }}></input>
        {/* Show Placeholder control, when description web part property is not set */}  
     {this.props.library == "" &&  
                <Placeholder iconName='Edit'  
                  iconText='Configure your web part'  
                  description='Please configure the web part.'  
                  buttonLabel='Configure'  
                  hideButton={this.props.displayMode === DisplayMode.Read}  
                  onConfigure={() => this._onConfigure()} /> 
     }  

        {/* Show description web part property, when set */} 
        {this.props.library  &&  
        <div>
            <div className={ styles.spFxWebCam }>
              <div className={ styles.container }>
                <div className={ styles.row }>
                  <div className={ styles.column }>
                    <span className={ styles.title }>SPFx Web/Mobile Camera Demo </span>
                    <p className={ styles.subTitle }>This is demo of how to open webcam and take photo from SPFx webpart.
                    It will open camera in mobile web browser also. Captured photo will be uploaded to library configured in webpart properties.</p>
                    <a onClick={() => this.opencam()} className={ styles.button }>
                      <span className={ styles.label }>Open webcam</span>
                    </a>
                    <a onClick={() => this.capture()} className={ styles.button }>
                      <span className={ styles.label }>Take Photo</span>
                    </a>
                      <a onClick={() => this.close()} className={ styles.button }>
                      <span className={ styles.label }>Close webcam</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
<Dialog
          hidden={this.state.hideDialog}
          onDismiss={this.close}
          dialogContentProps={{
            type: DialogType.normal,
            title: 'Your photo',
            subText: 'Do you want to save it?'
          }}
          modalProps={{
            titleAriaId: "photoModalTitle",
            subtitleAriaId: "photoModalSubtitle",
            isBlocking: false,
            styles: { main: { minWidth: 600 } },
            
          }}
        >

            <div id="capturedPhoto"  ref={(elm) => { this._capturedPhoto = elm; }}> 
            <img src={this.imageSrc}></img>
             </div>

          <DialogFooter>
            <PrimaryButton onClick={()=>this.upload()} text="Yes" />
            <DefaultButton onClick={()=>this._closeDialog()} text="Retake" />
          </DialogFooter>
        </Dialog>

          <div id="camContainer"    ref={(elm) => { this._camContainer = elm; }}>
          </div>
            <p>
                <p ref={(elm) => { this._messageContainer = elm; }}>
              </p>
            </p>
        </div>
        }
      </div>
    
    );
  }

  private _onConfigure() {
    // Context of the web part
    this.props.context.propertyPane.open();
  }

  private setRef = (webcam) => {
    this.setState({webcam:webcam});
  }
  public close(){
    ReactDom.unmountComponentAtNode(this._camContainer);
  }
  private capture(){
    
    this.imageSrc  =  this.state.webcam.getScreenshot();
    const element = React.createElement(
      'img',
      {
        src:this.imageSrc
      }
    );
    //ReactDom.render(element, this._capturedPhoto);
    
    this.setState({hideDialog:false});
    

  }

  private upload(){
    var sourcbase64 = this.imageSrc.replace("data:image/jpeg;base64,","");
    var arrayBuffer= this._base64ToArrayBuffer(sourcbase64);
    this.uploadFile(arrayBuffer);

  }

  private _base64ToArrayBuffer(base64) {
    var binary_string =  window.atob(base64);
    var len = binary_string.length;
    var bytes = new Uint8Array( len );
    for (var i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}

  private opencam () {
    ReactDom.unmountComponentAtNode(this._messageContainer);
      const element2: React.ReactElement<Webcam.WebcamProps > = React.createElement(
      Webcam,
      {
      height:350,
      width:350,
      screenshotFormat:"image/jpeg",
      ref:this.setRef,
      }
    );
    //const camContainer = document.getElementById("camContainer")
    ReactDom.render(element2, this._camContainer);
    
    
}

private _closeDialog = (): void => {
  this.setState({ hideDialog: true });
}

private uploadFileFromControl(){

  //Get the file from File DOM
var files = this._input.files;
var file = files[0];


   //Upload a file to the SharePoint Library
   sp.web.getFolderByServerRelativeUrl(this.props.context.pageContext.web.serverRelativeUrl + "/MyDocs")
   .files.add(file.name, file, true)
   .then((data) =>{
     alert("File uploaded sucessfully");
   })
   .catch((error) =>{
     alert("Error is uploading");
   });


}

private uploadFile(arrayBuffer){

//Get the file from File DOM
//var files = this._input.files;
//var file = files[0];
sp.web.lists.getById(this.props.library).select("Title","RootFolder/ServerRelativeUrl").expand("RootFolder").get().then((response)=>{

        //Upload a file to the SharePoint Library
        sp.web.getFolderByServerRelativeUrl(response.RootFolder.ServerRelativeUrl)
        .files.add(this.props.context.pageContext.user.displayName  + ".jpg", arrayBuffer, true)
        .then((data) =>{
          const element2 = React.createElement(
            MessageBar,
            {
              messageBarType:MessageBarType.success,
              isMultiline:false,
              dismissButtonAriaLabel:"Close"
            },
            "You photo has been upload successfully."
          );
          //const camContainer = document.getElementById("camContainer")
          ReactDom.render(element2, this._messageContainer);
          //this.close();
          this._closeDialog();
        })
        .catch((error) =>{
          alert("Error is uploading");
        });

});

}
}
