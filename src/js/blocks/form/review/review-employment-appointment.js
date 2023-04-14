import React from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { CurrencyFormat, DateFormat } from "../../components";
import { NewLine } from "../review";

export default function ReviewEmploymentAppointment() {
    const { getValues } = useFormContext();
    const [payroll,selectedRowPayRoll] = getValues(['payroll.PAYROLL_CODE','selectedRow.PAYROLL_AGENCY_CODE']);
    const [appointment] = getValues(['employment.appointment']);
    return (
        <article className="border rounded p-1 mb-2">
            <Row as="header">
                <Col as="h5">Appointment</Col>
            </Row>
            <Row as="dl" className="mb-0">
            {(payroll == "28020" && selectedRowPayRoll == "") && 
                <>
                    <Col as="dt" md={2} className="mb-0">Faculty:</Col>
                    <Col as="dd" md={4} className="mb-0">{(appointment.DERIVED_FAC_TYPE=="Y")?"Yes":"No"}</Col>
                </>
            }
            {(appointment.DERIVED_FAC_TYPE=="Y") &&
                <>
                    <Col as="dt" md={2} className="mb-0">Tenure Status:</Col>
                    <Col as="dd" md={4} className="mb-0">{appointment.TENURE_STATUS?.label}</Col>
                </>
            }
            {(appointment.TERM_DURATION!="") &&
                <>
                    <Col as="dt" md={2} className="mb-0">Term Duration:</Col>
                    <Col as="dd" md={4} className="mb-0">{appointment.TERM_DURATION}</Col>
                </>
            }
            {(appointment.noticeDate!="") &&
                <>
                    <Col as="dt" md={2} className="mb-0">Notice Date:</Col>
                    <Col as="dd" md={4} className="mb-0"><DateFormat>{appointment.noticeDate}</DateFormat></Col>
                </>
            }
                <Col as="dt" md={2} className="mb-0">Campus Title:</Col>
                <Col as="dd" md={4} className="mb-0">{appointment.CAMPUS_TITLE}</Col>
                <Col as="dt" md={2} className="mb-0">Supervisor:</Col>
                <Col as="dd" md={4} className="mb-0">{appointment.supervisor[0]?.label}</Col>
                <Col as="dt" md={2} className="mb-0">Department:</Col>
                <Col as="dd" md={4} className="mb-0">{appointment.REPORTING_DEPARTMENT_CODE?.label}</Col>
            </Row>
            {appointment.DERIVED_FAC_TYPE == "Y" && <ReviewEmploymentAppointmentFacultyDetails details={appointment.facultyDetails}/>}
            {payroll == '28029' && <ReviewEmploymentAppointmentStudentDetails details={appointment.studentDetails}/>}
        </article>
    );
}

function ReviewEmploymentAppointmentFacultyDetails({details}) {
    return (
        <section>
            <Row className="mt-3">
                <Col><h6 className="mb-0">Faculty Details:</h6></Col>
            </Row>
            <Row as="dl" className="mb-0">
                {
                    [
                        {id:'fallCourses',label:'Fall Courses'},
                        {id:'springCourses',label:'Spring Courses'}
                    ].map(c => (
                        <React.Fragment key={c.id}>
                            <Col as="dt" md={2} className="mb-0">{c.label}:</Col>
                            <Col as="dd" md={10} className="mb-0">{details[c.id].count}</Col>
                            <Col as="dt" md={2} className="mb-0">{c.label} List:</Col>
                            <Col as="dd" md={10} className="mb-0"><pre>{details[c.id].list}</pre></Col>
                        </React.Fragment>
                    ))
                }
            </Row>
        </section>
    )
}

function ReviewEmploymentAppointmentStudentDetails({details}) {
    return (
        <section className="mt-3">
            <Row>
                <Col><h6 className="mb-0">Student Details:</h6></Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" sm={2} className="mb-0">GPA:</Col>
                <Col as="dd" sm={4} className="mb-0">{Number.parseFloat(details.SHRLGPA_GPA).toFixed(2)}</Col>
                <Col as="dt" sm={2} className="mb-0">Incompletes:</Col>
                <Col as="dd" sm={4} className="mb-0">{details.INCOMPLETES}</Col>
                <Col as="dt" sm={2} className="mb-0">Missing Grades:</Col>
                <Col as="dd" sm={4} className="mb-0">{details.MISSING_GRADES}</Col>
                <Col as="dt" sm={2} className="mb-0">Grade Level</Col>
                <Col as="dd" sm={4} className="mb-0">{details.STVCLAS_CODE} - {details.STVCLAS_DESC}</Col>
                <Col as="dt" sm={2} className="mb-0">Last Term:</Col>
                <Col as="dd" sm={4} className="mb-0">{details.STVTERM_DESC} ({details.SGBSTDN_TERM_CODE_EFF})</Col>
                <Col as="dt" sm={2} className="mb-0">Program:</Col>
                <Col as="dd" sm={4} className="mb-0">{details.SMRPRLE_PROGRAM_DESC}</Col>
                <Col as="dt" sm={2} className="mb-0">Major:</Col>
                <Col as="dd" sm={4} className="mb-0">{details.STVMAJR_DESC}</Col>
                <Col as="dt" sm={2} className="mb-0">Academic History:</Col>
                <Col as="dd" sm={4} className="mb-0">{details.ACAD_HIST}</Col>
                <Col as="dt" sm={2} className="mb-0">Residency:</Col>
                <Col as="dd" sm={4} className="mb-0">{details.STVRESD_DESC} / {details.STVRESD_IN_STATE_DESC}</Col>
                <NewLine/>
                {
                    [
                        {id:'fall',label:'Fall'},
                        {id:'spring',label:'Spring'}
                    ].map(c => (
                        <React.Fragment key={c.id}>
                            <Col as="dt" sm={2} className="mb-0">{c.label} Tuition:</Col>
                            <Col as="dd" sm={4} className="mb-0"><CurrencyFormat>{details[c.id].tuition}</CurrencyFormat></Col>
                            <Col as="dt" sm={2} className="mb-0">{c.label} Credits:</Col>
                            <Col as="dd" sm={4} className="mb-0">{details[c.id].credits}</Col>
                        </React.Fragment>
                    ))
                }
                <Col as="dt" sm={2} className="mb-0">Receiving Fellowship:</Col>
                <Col as="dd" sm={4} className="mb-0">{(details.fellowship=="Y")?"Yes":"No"}</Col>
                {details.fellowship=="Y" && 
                    <>
                        <Col as="dt" sm={2} className="mb-0">Source of Fellowship:</Col>
                        <Col as="dd" sm={4} className="mb-0">{details.fellowshipSource?.label}</Col>
                    </>
                }
            </Row>
        </section>
    );
}