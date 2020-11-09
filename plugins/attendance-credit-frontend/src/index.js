import React, { useState, useEffect } from 'react';
import { render } from 'react-dom';
import { useZengineContext, ZnContextProvider } from '@zenginehq/react-sdk';
import { znMessage, znPluginData } from '@zenginehq/zengine-sdk';
import '@zenginehq/zengine-ui/style.css';
import { Button, Form, Select, Input, TextField, NumberField, Checkbox } from '@zenginehq/zengine-ui-react';
import axios from 'axios';

export const App = props => {
	const { context, triggerContextRefresh } = useZengineContext();
	const [show, setShow] = useState(false);
	const allForms = (context.workspace.forms).map((form) => [form.id,form.name]);
	const [done, toggleDone] = useState(false)
	const signInFormID = 118576;
	const signOutFormID = 118578;
	const activityCreditFormID = 126300;
	const [progress, updateProgress] = useState(0);
	const [signInEventFields, updateSignInEventFields] = useState([]);
	const [signInTime, updateSignInTime] = useState("");
	const [loading, toggleLoad] = useState(false)
	const [signOutTime, updateSignOutTime] = useState("");
	const [accessToken, updateAccessToken] = useState("")
	const [eventName, updateEventName] = useState("")
	const [signInSemesters, updateSemesterFields] = useState([])
	const [semester, updateEventSemester] = useState("")
	const [put, updatePut] = useState(false)
	const [includeTime, changeIncludeTime] = useState(false)
	const [showError, updateShowError] = useState(false)


	function changeDone(){
		toggleDone(false);
	}

	async function sendToACtivityCredit(both){
		//check here if update is true.. if so, send put request instead of post
		if(!put){
			var myHeaders = new Headers();
			myHeaders.append("Authorization", accessToken);
			myHeaders.append("Content-Type", "application/json");
			
			console.log(both)
			var size = both.length - 1
			for(var i = 0; i < both.length; i++) {
				updateProgress(((i/size)*100).toPrecision(4))
				var raw = JSON.stringify(
					{
						"field1948995": both[i][0],
						"field1948996": both[i][5],
						"field1956911": both[i][6],
						"field1961191": both[i][1],
						"field1961192": both[i][2],
						"field1948997": both[i][3],
						"field1961193": both[i][4]
					}
				);
				
				var requestOptions = {
				method: 'POST',
				headers: myHeaders,
				body: raw,
				redirect: 'follow'
				};
				
				await fetch("https://api.zenginehq.com/v1/forms/" + activityCreditFormID + "/records.json", requestOptions)
				.then(response => response.text())
				.then(result => console.log(result))
				.catch(error => console.log('error', error));
			}
		}
		else {
			console.log(both)
			var size = both.length - 1
			//issues here
			for (var i = 0; i < both.length; i++) {
				updateProgress(((i/size)*100).toPrecision(4))
				var currRecordID = ""
				var myHeaders = new Headers();
				myHeaders.append("Authorization", accessToken);

				var requestOptions = {
				method: 'GET',
				headers: myHeaders,
				redirect: 'follow'
				};
				
				await fetch("https://api.zenginehq.com/v1/forms/126300/records.json?limit=5000&field1948995=" + both[i][0] + "&field1948996=" + both[i][5] +"&field1956911=" + both[i][6], requestOptions)
				.then(response => response.text())
				.then(result => currRecordID = JSON.parse((result)).data[0].id)
				.catch(error => console.log('error', error));


				var myHeaders = new Headers();
				myHeaders.append("Authorization", accessToken);
				myHeaders.append("Content-Type", "application/json");

				var raw = JSON.stringify(
					{
						"field1948995": both[i][0],
						"field1948996": both[i][5],
						"field1956911": both[i][6],
						"field1961191": both[i][1],
						"field1961192": both[i][2],
						"field1948997": both[i][3],
						"field1961193": both[i][4]
					});

				var requestOptions = {
				method: 'PUT',
				headers: myHeaders,
				body: raw,
				redirect: 'follow'
				};

				await fetch("https://api.zenginehq.com/v1/forms/126300/records/" + currRecordID+ ".json", requestOptions)
				.then(response => response.text())
				.then(result => console.log(result))
				.catch(error => console.log('error', error));

			}
		}
		updatePut(false)
		toggleLoad(false)
		console.log("Donezo")
		toggleDone(true)


	}

	function calculateCredit(both){
		for (var attendee of both) {
			var stringSplitIn = attendee[1].split(" ")
			var attendeeSignIn = stringSplitIn[1]

			var stringSplitOut = attendee[2].split(" ")
			var attendeeSignOut = stringSplitOut[1]
			if (signInTime == "" && signOutTime == ""){
				if(attendee[1] == "" && attendee[2] == ""){
					attendee[4] = "Attendee didn't sign in or sign out"
				}
				else if(attendee[2] == ""){
					attendee[4] = "Attendee didn't sign out"
				}
				else if (attendee[1] == ""){
					attendee[4] = "Attendee didn't sign in"
				}
				else {
					attendee[3] = 1
				}
			}
			else {
				if (attendeeSignIn <= signInTime && attendeeSignOut >= signOutTime){
					attendee[3] = 1
				}
				else if(attendee[1] == ""){
					attendee[4] = "Attendee didn't sign in"
				}
				else if(attendee[2] == ""){
					attendee[4] = "Attendee didn't sign out"
				}
				else if (attendeeSignIn > signInTime && attendeeSignOut < signOutTime){
					attendee[4] = "Attendee didn't sign in on time and signed out too early"
				}
				else if(attendeeSignIn > signInTime){
					attendee[4] = "Attendee didn't sign in on time"
				}
				else if(attendeeSignOut < signOutTime){
					attendee[4] = "Attendee signed out too early"
				}
			}
		}
		console.log(both)
		sendToACtivityCredit(both)
	}

	function getUniqueStudents(signInData, signOutData) {
		var both = []
		console.log(signInData)
		for (var i = 0; i < signInData.length; i++){
			var currRow = [signInData[i][0], signInData[i][1]]
			var signOutTime = ""
			for (var j = 0; j < signOutData.length; j++){
				if (signInData[i][0] == signOutData[j][0]){
					signOutTime = signOutData[j][1]
				}
			}
			currRow.push(signOutTime)
			currRow.push(0)
			currRow.push("")
			currRow.push(eventName)
			currRow.push(semester)
			both.push(currRow)
		}

		for (var i = 0; i < signOutData.length; i++){
			var used = false;
			for (var j = 0; j < both.length; j++) {
				if (signOutData[i][0] == both[j][0]){
					used = true
				}
			}

			if (!used) {
				var currRow = []
				var signInTime = ""
				for (var k = 0; k < signInData.length; k++) {
					if (signOutData[i][0] == signInData[k][0]){
						signInTime = signInData[k][1]
					}
				}
				currRow.push(signOutData[i][0])
				currRow.push(signInTime)
				currRow.push(signOutData[i][1])
				currRow.push(0)
				currRow.push("")
				currRow.push(eventName)
				currRow.push(semester)

				both.push(currRow)
			}
		}

		console.log(both)

		calculateCredit(both)
	}

	async function generateActivtyCredit(booleanVal){

		console.log(put)
		toggleLoad(true)


		console.log(signOutFormID)
		var myHeaders = new Headers();
		myHeaders.append("Authorization", accessToken);
		

		
		var requestOptions = {
		  method: 'GET',
		  headers: myHeaders,
		  redirect: 'follow'
		};
		console.log(eventName)

		var stringify = eventName.split("&")
		var eventNameString = eventName
		if(stringify.length == 2){
			eventNameString = "\"" + stringify[0] + "%26" + stringify[1] + "\""
		}

		eventNameString = "\"" + eventNameString + "\""

		var signInData = []
		await fetch("https://api.zenginehq.com/v1/forms/" + signInFormID + "/records.json?field1956901=" + eventNameString + "&field1958206=" + semester + "&limit=5000", requestOptions)
		  .then(response => response.text())
		  .then(result => ((JSON.parse(result)).data).map((row) => signInData.push([row.field1956902, row.field1956905])))
		  .catch(error => console.log('error', error));

		console.log(signInData)


		var signOutData = []
		var myHeaders = new Headers();
		myHeaders.append("Authorization", accessToken);

		var requestOptions = {
			method: 'GET',
			headers: myHeaders,
			redirect: 'follow'
		};

		await fetch("https://api.zenginehq.com/v1/forms/"+ signOutFormID +"/records.json?limit=5000&field1956906="+ eventNameString +"&field1958214=" + semester, requestOptions)
		.then(response => response.text())
		.then(result => ((JSON.parse(result)).data).map((row) => signOutData.push([row.field1956907, row.field1956910]))) //(JSON.parse(result)).data).map((row) => signOutData.push([row.field1956907, row.field1956910]))
		.catch(error => console.log('error', error));

		getUniqueStudents(signInData, signOutData);
	}

	async function begin() {

		//we out hereeeeee

		console.log("Activty Credit" ,activityCreditFormID)
		var arr = [];
		setShow(!show)
		var myHeaders = new Headers();
		myHeaders.append("Authorization", accessToken);


		var requestOptions = {
			method: 'GET',
			headers: myHeaders,
			redirect: 'follow'
		};

		await fetch("https://api.zenginehq.com/v1/forms/118576/records.json?limit=5000", requestOptions)
		.then(response => response.text())
		.then(result => ((JSON.parse(result)).data).map((row) => arr.push(row.field1956901)))
		.catch(error => console.log('error', error));

		var signInFields = []

		for(var i = 0; i < arr.length; i++){
			if(signInFields.indexOf(arr[i]) < 0) {
				signInFields.push(arr[i])
			}
		}
		updateSignInEventFields(signInFields)


		var myHeaders = new Headers();
		myHeaders.append("Authorization", accessToken);


		var requestOptions = {
			method: 'GET',
			headers: myHeaders,
			redirect: 'follow'
		};
		
		var arr2 = []
		await fetch("https://api.zenginehq.com/v1/forms/118576/records.json?limit=5000", requestOptions)
		.then(response => response.text())
		.then(result => ((JSON.parse(result)).data).map((row) => arr2.push(row.field1958206)))
		.catch(error => console.log('error', error));

		var signInSemesters = []

		for(var i = 0; i < arr2.length; i++){
			if(signInSemesters.indexOf(arr2[i]) < 0) {
				signInSemesters.push(arr2[i])
			}
		}
		updateSemesterFields(signInSemesters)
	}

	function toggleUpdate(){
		updatePut(!put)
		console.log(put)
	}

	function toggleTime(){
		changeIncludeTime(!includeTime)
	}


	async function updateStudentStatus(){

			var sem = semester
			if(sem == ""){
				updateShowError(true)
			}
			else{
				updateShowError(false)
				updateProgress(0)
				toggleLoad(true)

				console.log("here")
				var student_record = []
				
				//getting student data from activity credit 
				var myHeaders = new Headers();
				myHeaders.append("Authorization",accessToken);
				
				var requestOptions = {
				method: 'GET',
				headers: myHeaders,
				redirect: 'follow'
				};
				
				await fetch("https://api.zenginehq.com/v1/forms/126300/records.json?limit=10000&field1956911=" + semester, requestOptions)
				.then(response => response.text())
				.then(result => ((JSON.parse(result)).data).map((row) => student_record.push([row.field1948995, row.field1948997, row.field1948996])))
				.catch(error => console.log('error', error));


				console.log(student_record)

				var student_activity_credit = []

				//adding uniques id's to student_activity_credit
				for (var i = 0; i <  student_record.length; i++){
					if (student_activity_credit.indexOf(student_record[i][0]) == -1){ //not in array
						student_activity_credit.push(student_record[i][0])
					}
				}

				console.log(student_activity_credit)

				var new_student_activity_credit = []
				//add total activity credit to student_activity_credit
				for (var i = 0; i < student_activity_credit.length; i++) {
					var total_credit = 0;
					var events_attended = []
					for (var j = 0; j < student_record.length; j++) {
						if (student_record[j][0] == student_activity_credit[i]){
							total_credit = total_credit + parseInt(student_record[j][1], 10)
							if (student_record[j][1] == "1") {
								events_attended.push(student_record[j][2])
							}
						}
					}
					new_student_activity_credit.push([student_activity_credit[i],total_credit,events_attended])
				}

				var lastProgress = 0;
				//get record id's from student status to send to put
				for (var i = 0; i < new_student_activity_credit.length; i++){
					updateProgress(((i/(2*new_student_activity_credit.length))*100).toPrecision(4))
					var myHeaders = new Headers();
					myHeaders.append("Authorization", accessToken);

					var requestOptions = {
					method: 'GET',
					headers: myHeaders,
					redirect: 'follow'
					};

					await fetch("https://api.zenginehq.com/v1/forms/127025/records.json?limit=10000&field1967738=" + new_student_activity_credit[i][0], requestOptions)
					.then(response => response.text())
					.then(result => new_student_activity_credit[i].push((JSON.parse(result)).data[0].id))
					.catch(error => console.log('error', error));
				
					lastProgress = i;
				}
			
				console.log(new_student_activity_credit)
				
				//updating student status with activity records
				for (var i = 0; i < new_student_activity_credit.length; i++) {
					updateProgress((((i+lastProgress)/(2*new_student_activity_credit.length))*100).toPrecision(4))
					if(typeof new_student_activity_credit[i][3] === 'undefined') {
						console.log(i)
					}
					else {
						var activities = (new_student_activity_credit[i][2])[0]
						for(var j = 1; j < new_student_activity_credit[i][2].length; j++){
							activities = activities + ", " + (new_student_activity_credit[i][2])[j]
						}
						console.log("found 1;", i)
						var myHeaders = new Headers();
						myHeaders.append("Authorization", accessToken);
						myHeaders.append("Content-Type", "application/json");

						var raw = JSON.stringify(
							{
								"field1969669": new_student_activity_credit[i][1],
								"field1975813" : activities
							});

						var requestOptions = {
						method: 'PUT',
						headers: myHeaders,
						body: raw,
						redirect: 'follow'
						};

						await fetch("https://api.zenginehq.com/v1/forms/127025/records/" + new_student_activity_credit[i][3] + ".json", requestOptions)
						.then(response => response.text())
						.then(result => console.log(result))
						.catch(error => console.log('error', error));
					}
				}
				toggleLoad(false)
				toggleDone(true)
			}
	}
		
	

	//this for sending put request in react

	
	// use any bootstrap 4 classes + zengine-ui components! 👍 👌
	
	return <main className='p-3'>
		<h1 style={{ textAlign: 'center' }}>Activity Credit Plugin</h1>
        


		<div class="please-wait" ng-show="processing">
			{!done && loading ? <img class="zn-loader" src="https://platform.zenginehq.com/images/zengine-loader.gif"></img> : <label></label>}
			{!done && loading ? <br></br>  : <label></label>}
			{!done && loading ? <label style={{ textAlign: 'center' }}>Current Progress: {progress} % </label> : <label></label>}
		</div>

		{done ? <img src="https://www.pinclipart.com/picdir/big/356-3569430_checked-and-done-done-and-done-clipart.png" width="10%" vertical-align="middle"></img> : <label></label>}
		{done ? <br></br> : <label></label>}
		{done ? <Button onClick={changeDone}>Back</Button> : <label></label>}

		<ul className="list-inline">
			<div>
				{!show ? <label>Access Token: </label>: <label></label>}

				{!show ? <input onChange = {text => updateAccessToken("Bearer " + text.target.value)}></input>: <label></label>}

				<br></br>
				{!show ? <a href="https://auth.zenginehq.com/oauth2/v1/authorize?client_id=rest-api-quick-start-demo&response_type=token&state=demo" target="_blank">Click here for access code</a>: <label></label>}
				<br></br>
				{!show ? <Button onClick = {begin}>Click Here to begin</Button>: <label></label>}
				{showError ? <label style={{ color: 'red' }}>*Please Choose a Semester before updating student status*</label>:<label></label>}
				{showError ? <br></br>:<label></label>}
				{show && ! done && !loading ? <label>Choose your Event Name</label> : <label></label>}
				{show && !done && !loading? <Select label="Choose your Event Name" options = {signInEventFields} onChange = {text => updateEventName(text.target.value)}></Select>: <label></label>}
				 <br></br>
				 {show && ! done && !loading ? <label>Choose your Event Semester</label> : <label></label>}
				{show && ! done && !loading ? <Select label="Choose your Event Semester" options = {signInSemesters} onChange = {text => updateEventSemester(text.target.value)}></Select>: <label></label>}
				 <br></br>
				 {includeTime ? <div>
					{show && ! done && !loading ? <label>Choose your Latest Allowed Sign-In Time (HH:MM *in military time) </label> : <label></label>}
					{show && ! done && !loading ? <input onChange = {text => updateSignInTime(text.target.value)}></input> : <label></label>}
					<br></br>
					{show && ! done && !loading ? <label>Choose your Earliest Allowed Sign-Out Time (HH:MM *in military time) </label> : <label></label>}
					{show && ! done && !loading ? <input onChange = {text => updateSignOutTime(text.target.value)}></input> : <label></label>}
					<br></br>
				 </div> : <label></label>}
				 <li className="list-inline-item">
					{show && ! done && !loading? <label>Toggle to update previously created records:   </label> : <label></label>}
					{show && ! done && !loading? <Checkbox onClick={toggleUpdate}>
					</Checkbox> : <label></label> }
				</li>
				{show && ! done && !loading? <br></br> : <label></label>}
				<li className="list-inline-item">
					{show && !done && !loading && includeTime ? <Button onClick={toggleTime}>Don't Include Time</Button> : <label></label> }
					{show && !done && !loading && !includeTime ? <Button onClick={toggleTime}>Include Time</Button> : <label></label> }
					<br></br>
					{show && ! done && !loading? <Button theme="success" onClick={generateActivtyCredit}>
						Generate Activity Credit
					</Button> : <label></label> }
					{show && ! done && !loading? <Button onClick={updateStudentStatus}>Update Student Status</Button> : <label></label>}

				</li>
			</div>
		</ul>
	</main>;
};

render(
	<ZnContextProvider>
		
		<App />
	</ZnContextProvider>,
	document.getElementById('app')
);
