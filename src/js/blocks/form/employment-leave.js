import React, { useCallback } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { HRFormContext } from "../../config/form";
import { Row, Col, Form, InputGroup} from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { useAppQueries } from "../../queries";
import { Loading, CurrencyFormat } from "../components";

const name = 'employment.leave';

export default function EmploymentLeave() {
    const { control, getValues, setValue } = useFormContext();
    const watchLeavePercent = useWatch({name:`${name}.leavePercent`,control:control})||0;
    const watchPayroll = useWatch({name:'payroll.PAYROLL_CODE',control:control});

    const handleRangeChange = e => setValue(`${name}.leavePercent`,e.target.value);

    const { getListData } = useAppQueries();
    const justification = getListData('leaveJustification');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    const calcLeaveSalary = useCallback(()=>{
        const newSal = getValues(`${name}.origSalary`)*(1-(watchLeavePercent/100));
        setValue(`${name}.leaveSalary`,newSal);
        return newSal;
    },[watchLeavePercent]);

    return (
        <HRFormContext.Consumer>
            {({readOnly}) => (
                <article>
                    <Row as="header">
                        <Col as="h3">Leave</Col>
                    </Row>
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Orginal Salary:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.CALCULATED_ANNUAL`}
                                control={control}
                                render={({field}) => <p className="mb-0"><CurrencyFormat>{field.value}</CurrencyFormat></p>}
                            />
                        </Col>
                    </Form.Group>

                    {/* TODO: on show Leave Pct and Leave Sal for EF-L-7 and EF-L-9 */}

                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Leave Percent:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.leavePercent`}
                                defaultValue="0"
                                control={control}
                                rules={{min:{value:0,message:'Leave Percent cannot be less than 0%'},max:{value:100,message:'Leave Percent cannot be greater than 100%'}}}
                                render={({field}) => <Form.Control {...field} type="number" min={0} max={100} disabled={readOnly}/>}
                            />
                        </Col>
                        <Col sm={8} md={6} className="pt-2">
                            <Form.Control type="range" name="leavePercentRange" id="leavePercentRange" min={0} max={100} value={watchLeavePercent} onChange={handleRangeChange} disabled={readOnly}/>
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
                                        disabled={readOnly}
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
                            {justification.isLoading && <Loading>Loading Data</Loading>}
                            {justification.isError && <Loading isError>Failed to Load</Loading>}
                            {justification.data &&
                                <Controller
                                    name={`${name}.justification.id`}
                                    control={control}
                                    render={({field}) => (
                                        <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={readOnly}>
                                            <option></option>
                                            {justification.data.map(j=>!j.excludePayrolls.includes(watchPayroll)&&<option key={j.id} value={j.id}>{j.title}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            }
                        </Col>
                    </Form.Group>
                </article>
            )}
        </HRFormContext.Consumer>    
    );
}