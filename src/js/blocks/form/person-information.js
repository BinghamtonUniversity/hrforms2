import React, { useCallback, useEffect } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { HRFormContext, useHRFormContext } from "../../config/form";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import DatePicker from "react-datepicker";
import { Icon } from "@iconify/react";
import { Loading } from "../components";
import useListsQueries from "../../queries/lists";
import get from "lodash/get";
import { FormFieldErrorMessage } from "../../pages/form";

const name = 'person.information';

export default function PersonInfo() {
    const { control, getValues, setValue, formState: { defaultValues, errors } } = useFormContext();
    const { canEdit, activeNav, journalStatus } = useHRFormContext();

    const watchRehireRetiree = useWatch({name:`${name}.REHIRE_RETIREE`});

    const { getListData } = useListsQueries();
    const salutations = getListData('salutations');

    const fieldDisabled = useCallback((field) => {
        if (!canEdit) return true;
        if (['PA','PF'].includes(journalStatus) && field.value) return true;
        return false;
    },[journalStatus, canEdit]);

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }

    const handleRehireRetireeChange = (e,field) => {
        field.onChange(e);
        if (e.target.value == 'No') {
            ['retiredDate','retiredFrom'].forEach(f=>setValue(`${name}.${f}`,''));
        }
    }
    useEffect(()=>{
        const field = document.querySelector(`#${activeNav} input:not([disabled])`);
        (canEdit&&field)&&field.focus({focusVisible:true});
    },[activeNav]);

    return (
        <HRFormContext.Consumer>
            {({showInTest,testHighlight,canEdit}) => (
                <>
                    <article className="mt-3">
                        <Row as="header">
                            <Col as="h3">Identification</Col>
                        </Row>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>SUNY ID:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.SUNY_ID`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.SUNY_ID`]}
                                    render={({field})=><Form.Control {...field} type="text" disabled={getValues('selectedRow.SUNY_ID')||!canEdit}/>}
                                />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>B-Number:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.LOCAL_CAMPUS_ID`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.LOCAL_CAMPUS_ID`]}
                                    render={({field})=><Form.Control {...field} type="text" disabled={fieldDisabled(field)}/>}
                                />
                            </Col>
                        </Form.Group>
                    </article>
                    <article className="mt-3">
                        <Row as="header">
                            <Col as="h3">Name</Col>
                        </Row>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Salutation:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.SALUTATION_CODE.id`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.SALUTATION_CODE.id`]}
                                    render={({field})=>(
                                        <>
                                            {salutations.isLoading && <div className="pt-2"><Loading>Loading Data</Loading></div>}
                                            {salutations.isError && <div className="pt-2"><Loading isError>Failed to Load</Loading></div>}
                                            {salutations.data &&
                                                <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={fieldDisabled(field)}>
                                                    <option></option>
                                                    {salutations.data.map(s=><option key={s[0]} value={s[0]}>{s[1]}</option>)}
                                                </Form.Control>
                                            }
                                        </>
                                    )}
                                />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>First Name*:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.LEGAL_FIRST_NAME`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.LEGAL_FIRST_NAME`]}
                                    render={({field})=><Form.Control {...field} type="text" disabled={fieldDisabled(field)} isInvalid={!!get(errors,field.name,false)}/>}
                                />
                                <FormFieldErrorMessage fieldName={`${name}.LEGAL_FIRST_NAME`}/>
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Preferred Name (optional):</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.ALIAS_FIRST_NAME`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.ALIAS_FIRST_NAME`]}
                                    render={({field})=><Form.Control {...field} type="text" disabled={fieldDisabled(field)}/>}
                                />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Middle Name:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.LEGAL_MIDDLE_NAME`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.LEGAL_MIDDLE_NAME`]}
                                    render={({field})=><Form.Control {...field} type="text" disabled={fieldDisabled(field)}/>}
                                />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Last Name*:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.LEGAL_LAST_NAME`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.LEGAL_LAST_NAME`]}
                                    render={({field})=><Form.Control {...field} type="text" disabled={fieldDisabled(field)} isInvalid={!!get(errors,field.name,false)}/>}
                                />
                                <FormFieldErrorMessage fieldName={`${name}.LEGAL_LAST_NAME`}/>
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Suffix:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${name}.SUFFIX_CODE`}
                                    control={control}
                                    defaultValue={defaultValues[`${name}.SUFFIX_CODE`]}
                                    render={({field})=><Form.Control {...field} type="text" disabled={fieldDisabled(field)}/>}
                                />
                            </Col>
                        </Form.Group>
                    </article>
                    <article className="mt-3">
                        <Row as="header">
                            <Col as="h3">Additional Information</Col>
                        </Row>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Volunteer Firefighter/EMT:</Form.Label>
                            <Col xs="auto" className="pt-2">
                                <Controller
                                    name={`${name}.VOLUNTEER_FIRE_FLAG`}
                                    defaultValue={defaultValues[`${name}.VOLUNTEER_FIRE_FLAG`]}
                                    control={control}
                                    render={({field}) => (
                                        <>
                                            <Form.Check {...field} inline type="radio" label="Yes" value='1' checked={field.value=='1'} disabled={fieldDisabled(field)}/>
                                            <Form.Check {...field} inline type="radio" label="No" value='0' checked={field.value=='0'} disabled={fieldDisabled(field)}/>
                                        </>
                                    )}
                                />
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Rehire Retiree:</Form.Label>
                            <Col xs="auto" className="pt-2">
                                <Controller
                                    name={`${name}.REHIRE_RETIREE`}
                                    defaultValue={defaultValues[`${name}.REHIRE_RETIREE`]}
                                    control={control}
                                    render={({field}) => (
                                        <>
                                            <Form.Check {...field} inline type="radio" label="Yes" value='1' checked={field.value=='1'} onChange={e=>handleRehireRetireeChange(e,field)} disabled={fieldDisabled(field)}/>
                                            <Form.Check {...field} inline type="radio" label="No" value='0' checked={field.value=='0'} onChange={e=>handleRehireRetireeChange(e,field)} disabled={fieldDisabled(field)}/>
                                        </>
                                    )}
                                />
                            </Col>
                        </Form.Group>
                        {(watchRehireRetiree=='1'||showInTest) &&
                            <>
                                <Form.Group as={Row} className={testHighlight(watchRehireRetiree=='1')}>
                                    <Form.Label column md={2}>Retired Date:</Form.Label>
                                    <Col xs="auto">
                                        <InputGroup>
                                            <Controller
                                                name={`${name}.retiredDate`}
                                                defaultValue={defaultValues[`${name}.retiredDate`]}
                                                control={control}
                                                render={({field}) => <Form.Control
                                                    as={DatePicker}
                                                    name={field.name}
                                                    closeOnScroll={true}
                                                    selected={field.value}
                                                    onChange={field.onChange}
                                                    autoComplete="off"
                                                    disabled={fieldDisabled(field)}
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
                                <Form.Group as={Row} className={testHighlight(watchRehireRetiree=='1')}>
                                    <Form.Label column md={2}>Retired From*:</Form.Label>
                                    <Col xs="auto">
                                        <Controller
                                            name={`${name}.RETIRED_FROM`}
                                            control={control}
                                            defaultValue={defaultValues[`${name}.RETIRED_FROM`]}
                                            render={({field})=><Form.Control {...field} type="text" isInvalid={!!get(errors,field.name,false)} disabled={fieldDisabled(field)}/>}
                                        />
                                        <FormFieldErrorMessage fieldName={`${name}.RETIRED_FROM`}/>
                                    </Col>
                                </Form.Group>
                            </>
                        }
                    </article>
                </>
            )}
        </HRFormContext.Consumer>
    );
}