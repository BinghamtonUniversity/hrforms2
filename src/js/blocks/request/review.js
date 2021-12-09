import React, { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import { useFormContext, useWatch } from "react-hook-form";
import { format } from "date-fns";

export default function Review() {
    const requiredFields = ['posType.id','reqType.id','effDate','orgName','comment'];
    const {control,getValues} = useFormContext();
    const watchRequiredFields = useWatch({control:control,name:requiredFields});
    const [missingFields,setMissingFields] = useState([]);
    const formValues = getValues();
    useEffect(() => {
        // this has to be pulled up to disabled submit button.
        setMissingFields(watchRequiredFields.map((v,i) => (v == '') && i ).filter(el=>!!el));
    },[watchRequiredFields]);
    return (
        <>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4>Position Request Information</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    <Col as="dt" sm={2} className="mb-0">Request ID:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.reqId}</Col>
                    <Col as="dt" sm={2} className="mb-0">Effective Date:</Col>
                    <Col as="dd" sm={4} className="mb-0">{format(formValues.effDate,'M/d/yyyy')}</Col>
                    <Col as="dt" sm={2} className="mb-0">Position Type:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.posType.id} - {formValues.posType.title}</Col>
                    <Col as="dt" sm={2} className="mb-0">Request Type:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.reqType.id} - {formValues.reqType.title} </Col>
                    <Col as="dt" sm={2} className="mb-0">Candidate Name:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.candidateName}</Col>
                    <Col as="dt" sm={2} className="mb-0">B-Number:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.bNumber}</Col>
                </Row>
            </section>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4>Position Data</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    <Col as="dt" sm={2} className="mb-0">Line Number:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.lineNumber}</Col>
                    <Col as="dt" sm={2} className="mb-0">Requested Salary:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.minSalary} - {formValues.maxSalary}</Col>
                    <Col as="dt" sm={2} className="mb-0">FTE:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.fte}</Col>
                    <Col as="dt" sm={2} className="mb-0">Pay Basis:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.payBasis.id} - {formValues.payBasis.title}</Col>
                    {formValues.posType.id == 'C' && 
                    <>
                        <Col as="dt" sm={2} className="mb-0">Current Salary Grade:</Col>
                        <Col as="dd" sm={4} className="mb-0">{formValues.currentGrade}</Col>
                        <Col as="dt" sm={2} className="mb-0">New Salary Grade:</Col>
                        <Col as="dd" sm={4} className="mb-0">{formValues.newGrade}</Col>
                    </>
                    }
                    <Col as="dt" sm={2} className="mb-0">Requested Budget Title:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.reqBudgetTitle.title}</Col>
                    <Col as="dt" sm={2} className="mb-0">Appointment Status:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.apptStatus.title}</Col>
                    <Col as="dt" sm={2} className="mb-0">Appointment Duration:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.apptDuration}</Col>
                    <Col as="dt" sm={2} className="mb-0">Tentative End Date:</Col>
                    <Col as="dd" sm={4} className="mb-0">{format(formValues.tentativeEndDate,'M/d/yyyy')}</Col>
                </Row>
            </section>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4>Account Data</h4>
                        </Col>
                    </Row>
                </header>
                <Row as="dl" className="mb-0">
                    <Col as="dt" sm={2} className="mb-0">Org Name:</Col>
                    <Col as="dd" sm={4} className="mb-0">{formValues.orgName}</Col>
                    {formValues.posType.id == 'F' &&
                    <>
                        <Col as="dt" sm={2} className="mb-0">Expenditure Type:</Col>
                        <Col as="dd" sm={4} className="mb-0">{formValues.expType}</Col>
                    </>
                    }
                </Row>
            </section>
            <section className="mb-4">
                <header>
                    <Row>
                        <Col>
                            <h4>Comments:</h4>
                        </Col>
                    </Row>
                </header>
            </section>
        </>
    );
}
