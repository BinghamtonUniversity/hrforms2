import React from "react";
import { useFormContext } from "react-hook-form";
import { Row, Col, Table } from "react-bootstrap";
import { CurrencyFormat, DateFormat } from "../../components";

export default function ReviewEmploymentPay() {
    return (
        <article className="border rounded p-1 mb-2">
            <Row as="header">
                <Col as="h5">Pay</Col>
            </Row>
            <ReviewEmploymentPayExisting/>
            <ReviewEmploymentPayNew/>
        </article>
    );
}

function ReviewEmploymentPayExisting() {
    const { getValues } = useFormContext();
    const [info] = getValues(['employment.pay.existingPay']);
    return (
        <section>
            <Row>
                <Col><h6 className="mb-0">Existing Pay:</h6></Col>
            </Row>
            <Table striped bordered size="sm">
                <thead className="bg-secondary">
                    <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Account</th>
                        <th>Department</th>
                        <th>Supervisor</th>
                        <th>Rate</th>
                        <th>Award Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {info.map(r=>(
                        <React.Fragment key={r.HR_COMMITMENT_ID}>
                            <tr>
                                <td><DateFormat>{r.commitmentEffDate}</DateFormat></td>
                                <td><DateFormat>{r.commitmentEndDate}</DateFormat></td>
                                <td>{[r.ACCOUNT_NUMBER?.ACCOUNT_CODE,r.ACCOUNT_NUMBER?.ACCOUNT_DESCRIPTION].join(': ')}</td>
                                <td>{r.REPORTING_DEPARTMENT_NAME}</td>
                                <td>{r.supervisorSortName}</td>
                                <td><CurrencyFormat>{r.COMMITMENT_RATE}</CurrencyFormat></td>
                                <td><CurrencyFormat>{r.STUDENT_AWARD_AMOUNT}</CurrencyFormat></td>
                            </tr>
                            <tr>
                                <td>Duties:</td>
                                <td colSpan="6"><pre>{r.DUTIES}</pre></td>
                            </tr>
                        </React.Fragment>
                    ))}
                </tbody>
            </Table>
        </section>
    );
}

function ReviewEmploymentPayNew() {
    const { getValues } = useFormContext();
    const [info] = getValues(['employment.pay.newPay']);
    return (
        <section>
            <Row>
                <Col><h6 className="mb-0">New Pay:</h6></Col>
            </Row>
            <Table striped bordered size="sm">
                <thead className="bg-secondary">
                    <tr>
                        <th>Start Date</th>
                        <th>End Date</th>
                        <th>Account</th>
                        <th>Department</th>
                        <th>Supervisor</th>
                        <th>Rate</th>
                        <th>Award Amt</th>
                    </tr>
                </thead>
                <tbody>
                    {info.map((r,i)=>(
                        <React.Fragment key={i}>
                            <tr>
                                <td><DateFormat>{r.startDate}</DateFormat></td>
                                <td><DateFormat>{r.endDate}</DateFormat></td>
                                <td>{r.account[0].label}</td>
                                <td>{r.department.label}</td>
                                <td>{r.supervisor[0].label}</td>
                                <td><CurrencyFormat>{r.hourlyRate}</CurrencyFormat></td>
                                <td><CurrencyFormat>{r.awardAmount}</CurrencyFormat></td>
                            </tr>
                            <tr>
                                <td>Duties:</td>
                                <td colSpan="6"><pre>{r.duties}</pre></td>
                            </tr>
                        </React.Fragment>
                    ))}
                </tbody>
            </Table>
        </section>
    );
}