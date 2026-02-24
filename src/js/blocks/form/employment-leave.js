import React, { useCallback, useEffect } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { HRFormContext, useHRFormContext } from "../../config/form";
import { Row, Col, Form, InputGroup} from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { Loading, CurrencyFormat } from "../components";
import useListsQueries from "../../queries/lists";
import get from "lodash/get";
import { FormFieldErrorMessage } from "../../pages/form";

const name = 'employment.leave';
const idName = 'employmentLeave';

export default function EmploymentLeave() {
    const { control, getValues, setValue, formState: { defaultValues, errors } } = useFormContext();
    const { canEdit, activeNav, formType } = useHRFormContext();

    const watchLeavePercent = useWatch({name:`${name}.leavePercent`,control:control})||0;
    const watchPayroll = useWatch({name:'payroll.PAYROLL_CODE',control:control});

    const handleLeavePct = useCallback((e,field) => {
        switch(e.type) {
            case "change":
                if (!!e.target.value && (parseInt(e.target.value,10) < 0 || parseInt(e.target.value,10) > 100)) return false;
                field.onChange(e);
                break;
            case "blur":
                if (!e.target.value) setValue(field.name,0);
                break;
        }
    },[setValue]);

    const { getListData } = useListsQueries();
    const justification = getListData('leaveJustification');

    const handleSelectChange = useCallback((e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    },[setValue]);

    const calcLeaveSalary = useCallback(()=>{
        const newSal = getValues(`${name}.origSalary`)*(1-(watchLeavePercent/100));
        setValue(`${name}.leaveSalary`,newSal);
        return newSal;
    },[watchLeavePercent]);

    useEffect(() => {
        const field = document.querySelector(`#${activeNav} input:not([disabled])`);
        (canEdit&&field)&&field.focus({focusVisible:true});
    },[activeNav]);

    return (
        <HRFormContext.Consumer>
            {({canEdit,showInTest,testHighlight}) => (
                <article>
                    <Row as="header">
                        <Col as="h3">Leave</Col>
                    </Row>
                    <Row className="mb-2">
                        <Col md={2}>
                            <p className="form-label col-form-label">Original Salary:</p>
                        </Col>
                        <Col xs="auto">
                            <Controller
                                name={`${name}.CALCULATED_ANNUAL`}
                                defaultValue={defaultValues[`${name}.CALCULATED_ANNUAL`]}
                                control={control}
                                render={({field}) => <p className="mb-0"><CurrencyFormat>{field.value}</CurrencyFormat></p>}
                            />
                        </Col>
                    </Row>
                    <Row as="fieldset" className="mb-2">
                        <Col md={2}>
                            <legend className="form-label col-form-label">Leave Percent:</legend>
                        </Col>
                        <Col xs="auto">
                            <Form.Label htmlFor={`${idName}-leavePercent`} srOnly>Leave Percent:</Form.Label>
                            <Controller
                                name={`${name}.leavePercent`}
                                defaultValue={defaultValues[`${name}.leavePercent`]}
                                control={control}
                                render={({field}) => <Form.Control {...field} type="number" id={`${idName}-leavePercent`} min={0} max={100} onChange={e=>handleLeavePct(e,field)} onBlur={e=>handleLeavePct(e,field)} disabled={!canEdit}/>}
                            />
                        </Col>
                        <Col sm={8} md={6} className="pt-2">
                            <Form.Label htmlFor={`${idName}-leavePercentRange`} srOnly>Leave Percent Range:</Form.Label>
                            <Form.Control type="range" name="leavePercentRange" id={`${idName}-leavePercentRange`} min={0} max={100} value={watchLeavePercent} onChange={e=>setValue(`${name}.leavePercent`,e.target.value)} disabled={!canEdit} list="markers"/>
                            <datalist id="markers" className="marker">
                                <option value="0">0%</option>
                                <option value="25">25%</option>
                                <option value="50">50%</option>
                                <option value="75">75%</option>
                                <option value="100">100%</option>
                            </datalist>
                        </Col>
                    </Row>
                    <Row className="mb-2">
                        <Col md={2}>
                            <p className="form-label col-form-label">Leave Salary:</p>
                        </Col>
                        <Col xs="auto" className="pt-2">
                            <p className="mb-0">
                                <CurrencyFormat>{calcLeaveSalary()}</CurrencyFormat>
                            </p>
                        </Col>
                    </Row>
                    <Form.Group as={Row} controlId={`${idName}-leaveEndDate`}>
                        <Form.Label column md={2}>Leave End Date*:</Form.Label>
                        <Col xs="auto">
                            <InputGroup>
                                <Controller
                                    name={`${name}.leaveEndDate`}
                                    defaultValue={defaultValues[`${name}.leaveEndDate`]}
                                    control={control}
                                    render={({field}) => <Form.Control
                                        as={DatePicker}
                                        name={field.name}
                                        selected={field.value}
                                        closeOnScroll={true}
                                        onChange={field.onChange}
                                        autoComplete="off"
                                        disabled={!canEdit}
                                        isInvalid={!!get(errors,field.name,false)}
                                    />}
                                />
                                <InputGroup.Append>
                                    <InputGroup.Text>
                                        <Icon icon="mdi:calendar-blank"/>
                                    </InputGroup.Text>
                                </InputGroup.Append>
                            </InputGroup>
                            <FormFieldErrorMessage fieldName={`${name}.leaveEndDate`}/>
                        </Col>
                    </Form.Group>
                    <Form.Group as={Row} controlId={`${idName}-justification`}>
                        <Form.Label column md={2}>Justification*:</Form.Label>
                        <Col xs="auto">
                            {justification.isLoading && <Loading>Loading Data</Loading>}
                            {justification.isError && <Loading isError>Failed to Load</Loading>}
                            {justification.data &&
                                <Controller
                                    name={`${name}.justification.id`}
                                    defaultValue={defaultValues[`${name}.justification`]}
                                    control={control}
                                    render={({field}) => (
                                        <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                            <option></option>
                                            {justification.data.map(j=>!j.excludePayrolls.includes(watchPayroll)&&<option key={j.id} value={j.id}>{j.title}</option>)}
                                        </Form.Control>
                                    )}
                                />
                            }
                            <FormFieldErrorMessage fieldName={`${name}.justification.id`}/>
                        </Col>
                    </Form.Group>
                </article>
            )}
        </HRFormContext.Consumer>
    );
}