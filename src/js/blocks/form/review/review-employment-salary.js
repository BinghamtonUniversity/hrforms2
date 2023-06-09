import React from "react";
import { Row, Col, Table } from "react-bootstrap";
import { useFormContext } from "react-hook-form";
import { CurrencyFormat, DateFormat } from "../../components";
import { NewLine } from "../review";

export default function ReviewEmploymentSalary() {
    const { getValues } = useFormContext();
    const [salary] = getValues(['employment.salary']);
    return (
        <article className="border rounded p-1 mb-2">
            <Row as="header">
                <Col as="h5">Salary</Col>
            </Row>
            <Row as="dl" className="mb-0">
                <Col as="dt" md={2} className="mb-0">Effective Date:</Col>
                <Col as="dd" md={4} className="mb-0"><DateFormat>{salary.effDate}</DateFormat></Col>
                <Col as="dt" md={2} className="mb-0">Pay Basis:</Col>
                <Col as="dd" md={4} className="mb-0">{salary.PAY_BASIS}</Col>
                <Col as="dt" md={2} className="mb-0">Percent:</Col>
                <Col as="dd" md={4} className="mb-0">{salary.APPOINTMENT_PERCENT}%</Col>
                <Col as="dt" md={2} className="mb-0">Payments:</Col>
                <Col as="dd" md={4} className="mb-0">{salary.NUMBER_OF_PAYMENTS}</Col>
                <Col as="dt" md={2} className="mb-0">Rate:</Col>
                <Col as="dd" md={4} className="mb-0"><CurrencyFormat>{salary.RATE_AMOUNT}</CurrencyFormat></Col>
                <Col as="dt" md={2} className="mb-0">Total:</Col>
                <Col as="dd" md={4} className="mb-0"><CurrencyFormat>{salary.totalSalary}</CurrencyFormat></Col>
                <NewLine/>
                {(!salary.SUNYAccountsSplit) && 
                    <>
                        <Col as="dt" md={2} className="mb-0">Account:</Col>
                        <Col as="dd" md={4} className="mb-0">{salary.SUNYAccounts[0].account[0].label}</Col>
                    </>
                }
                {(salary.SUNYAccountsSplit) && 
                    <>
                        <Col as="dt" md={2} className="mb-0">Split Account:</Col>
                        <Col as="dd" md={4} className="mb-0">Yes</Col>
                    </>
                }
            </Row>
            {(salary.SUNYAccountsSplit) && <SplitSalary accounts={salary.SUNYAccounts} total={salary.totalSalary}/>}
            {(salary.ADDITIONAL_SALARY.length > 0) && <AdditionalSalary additional={salary.ADDITIONAL_SALARY}/>}
            {(salary.SPLIT_ASSIGNMENTS.length > 0) && <SplitAssignment assignments={salary.SPLIT_ASSIGNMENTS}/>}
        </article>
    );
}

function SplitSalary({accounts,total}) {
    return (
        <section className="mt-2">
            <Row>
                <Col><h6>Split Salary:</h6></Col>
            </Row>
            <Row>
                <Col>
                    <Table bordered striped size="sm">
                        <thead className="bg-main text-white">
                            <tr>
                                <th>Account</th>
                                <th>Percent</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {accounts.map((a,i) => (
                                <tr key={i}>
                                    <td>{a.account[0].label}</td>
                                    <td>{a.pct}</td>
                                    <td><CurrencyFormat>{(a.pct/100)*total}</CurrencyFormat></td>
                                </tr> 
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </section>
    );
}

function AdditionalSalary({additional}) {
    return (
        <section className="mt-2">
            <Row>
                <Col><h6>New Additional Salary:</h6></Col>
            </Row>
            <Row>
                <Col>
                    <Table bordered striped size="sm">
                        <thead className="bg-main text-white">
                            <tr>
                                <th>Type</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Account</th>
                                <th>Payments</th>
                                <th>Amount</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {additional.map((a,i) => (
                                <tr key={i}>
                                    <td>{a.type.label}</td>
                                    <td><DateFormat>{a.startDate}</DateFormat></td>
                                    <td><DateFormat>{a.endDate}</DateFormat></td>
                                    <td>{a.account[0].label}</td>
                                    <td>{a.payments}</td>
                                    <td><CurrencyFormat>{a.amount}</CurrencyFormat></td>
                                    <td><CurrencyFormat>{a.total}</CurrencyFormat></td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </section>
    );
}

function SplitAssignment({assignments}) {
    return (
        <section className="mt-2">
            <Row>
                <Col><h6>Split Salary:</h6></Col>
            </Row>
            <Row>
                <Col>
                    <Table bordered striped size="sm">
                        <thead className="bg-secondary">
                            <tr>
                                <th>Primary</th>
                                <th>Start Date</th>
                                <th>End Date</th>
                                <th>Title</th>
                                <th>Department</th>
                                <th>Supervisor</th>
                                <th>Allocation</th>
                                <th>Percent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {assignments.map((a,i) => (
                                <React.Fragment key={i}>
                                    <tr>
                                        <td>{a.COMMITMENT_PRIMARY_FLAG}</td>
                                        <td><DateFormat>{a.commitmentEffDate}</DateFormat></td>
                                        <td><DateFormat>{a.commitmentEndDate}</DateFormat></td>
                                        <td>{a.CAMPUS_TITLE}</td>
                                        <td>{a.REPORTING_DEPARTMENT_CODE.label}</td>
                                        <td>{a.SUPERVISOR_NAME}</td>
                                        <td>{a.WORK_ALLOCATION.label}</td>
                                        <td>{a.WORK_PERCENT}</td>
                                    </tr>
                                    <tr>
                                        <td>Duties:</td>
                                        <td colSpan="7"><pre>{a.DUTIES}</pre></td>
                                    </tr>
                                </React.Fragment>
                            ))}
                        </tbody>
                    </Table>
                </Col>
            </Row>
        </section>
    );
    }
