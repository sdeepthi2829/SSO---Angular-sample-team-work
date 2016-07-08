/**
 * Created by vamshi on 3/18/2016.
 */
function Hospital(department){
    this.department = department;
}

function Doctor(name, specialization){
    this.name=name;
    this.speacialization=specialization;
}

function patient(id,ailment){
    this.id=id;
    this.ailment=ailment;
}

Doctor.prototype=new Hospital("St.Francis");
patient.prototype = new Doctor("Nirmala", "Opthomlogist");

var patient_details= new patient(123,"viralFever");
function someFun(){
    console.log(hello);
    var hello="Hi! This is chitti";
    
}
function fun() {

    console.log(patient_details.name+"  "+patient_details.ailment);
    
}