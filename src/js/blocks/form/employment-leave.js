import React, { useEffect, useCallback } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { HRFormContext } from "../../pages/form";
import { Row, Col, Form, InputGroup} from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import useFormQueries from "../../queries/forms";
import { useAppQueries } from "../../queries";
import { CurrencyFormat } from "../components";

const name = 'employment.leave';

//N.B. paybasis BIW,FEE,HRY should not have/use this tab
// need to fetch salary data from buhr_salary_mv

// Only show Leave Percent and Calculated Salary if transaction is partial leave

export default function EmploymentLeave() {
    const { control, getValues, setValue } = useFormContext();
    const watchFields = useWatch({name:['selectedRow','effDate'],control:control});
    const watchLeavePercent = useWatch({name:`${name}.leavePercent`,control:control})||0;
    const watchPayroll = useWatch({name:'payroll.code',control:control});
    //const watchFormType = useWatch({name:['formActions.formCode','formActions.actionCode','formActions.transactionCode'],control:control});

    const handleRangeChange = e => setValue(`${name}.leavePercent`,e.target.value);

    const { getListData } = useAppQueries();
    const justifcation = getListData('leaveJustification');

    const { getSalary } = useFormQueries();
    const salary = getSalary({
        sunyId:watchFields[0].SUNY_ID,
        effDate:watchFields[1],
        options:{
            enabled:false,
            onSuccess: d => {
                setValue(`${name}.origSalary`,d[0]?.RATE_AMOUNT);
            }
        }
    });
    const calcLeaveSalary = useCallback(() => {
        return (+getValues(`${name}.origSalary`) * (1-(+watchLeavePercent/100)));
    },[watchLeavePercent,getValues]);

    useEffect(() => {
        if (!watchFields[0]?.SUNY_ID) return;
        salary.refetch().then(()=>calcLeaveSalary());
    },[watchFields]);
    return (
        <article>
            <Row as="header">
                <Col as="h3">Leave</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Orginal Salary:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.origSalary`}
                        control={control}
                        render={({field}) => <p className="mb-0"><CurrencyFormat>{field.value}</CurrencyFormat></p>}
                    />
                </Col>
            </Form.Group>

            {/* on show Leave Pct and Leave Sal for EF-L-7 and EF-L-9 */}
            <HRFormContext.Consumer>
                {({formActions}) => (
                    <p>{formActions.formCode}</p>
                )}
            </HRFormContext.Consumer>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Leave Percent:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.leavePercent`}
                        defaultValue="0"
                        control={control}
                        rules={{min:{value:0,message:'Leave Percent cannot be less than 0%'},max:{value:100,message:'Leave Percent cannot be greater than 100%'}}}
                        render={({field}) => <Form.Control {...field} type="number" min={0} max={100}/>}
                    />
                </Col>
                <Col sm={8} md={6} className="pt-2">
                    <Form.Control type="range" name="leavePercentRange" id="leavePercentRange" min={0} max={100} value={watchLeavePercent} onChange={handleRangeChange}/>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Leave Salary:</Form.Label>
                <Col xs="auto" className="pt-2">
                    <p className="mb-0">
                        <CurrencyFormat>{calcLeaveSalary()}</CurrencyFormat>
                    </p>
                </Col>
            </Form.Group>

            <Form.Group as={Row}>
                <Form.Label column md={2}>Leave End Date:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name={`${name}.leaveEndDate`}
                            control={control}
                            render={({field}) => <Form.Control
                                as={DatePicker}
                                name={field.name}
                                selected={field.value}
                                closeOnScroll={true}
                                onChange={field.onChange}
                                autoComplete="off"
                            />}
                        />
                        <InputGroup.Append>
                            <InputGroup.Text>
                                <Icon icon="mdi:calendar-blank"/>
                            </InputGroup.Text>
                        </InputGroup.Append>
                    </InputGroup>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Justification:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.justification`}
                        control={control}
                        render={({field}) => (
                            <Form.Control {...field} as="select">
                                <option></option>
                                {justifcation.data && justifcation.data.map(j=>!j.excludePayrolls.includes(watchPayroll)&&<option key={j.id} value={j.id}>{j.title}</option>)}
                            </Form.Control>
                        )}
                    />
                </Col>
            </Form.Group>
        </article>
    );
}