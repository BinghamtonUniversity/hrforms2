import React, { useState, useEffect, useRef } from "react";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { Icon } from "@iconify/react";
import { get } from "lodash";
import { Loading, DepartmentSelector } from "../components";
import DatePicker from "react-datepicker";
import { useHRFormContext } from "../../config/form";
import useFormQueries from "../../queries/forms";
import useListsQueries from "../../queries/lists";

const name = 'employment.volunteer';

export default function EmploymentSeparation() {
    const { canEdit, activeNav, defaultValues, showInTest, testHighlight } = useHRFormContext();
    const ref = useRef();

    const { control, getValues, setValue, formState: { errors } } = useFormContext();
    const [subRoleId] = useWatch({name:[`${name}.subRole.id`]});

    const { getListData } = useListsQueries();
    const subroles = getListData('volunteerSubRoles');
    const servicetypes = getListData('volunteerServiceTypes');
    const tenurestatus = getListData('tenureStatus',{enabled:subRoleId=='Instructor'});

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
        if (nameBase == `${name}.subRole`) {
            // clear conditional fields: tenureStatus, univOfficial, and supervisor
            setValue(`${name}.tenureStatus`,'');
            setValue(`${name}.univOfficial`,[{id:'',label:''}]);
            setValue(`${name}.supervisor`,[{id:'',label:''}]);
        }
    }

    useEffect(()=>(canEdit&&ref.current)&&ref.current.focus(),[activeNav,subroles]);

    return (
        <article>
            <Row as="header">
                <Col as="h3">Volunteer</Col>
            </Row>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Sub-Role*:</Form.Label>
                <Col xs="auto">
                    {subroles.isLoading && <Loading>Loading Data</Loading>}
                    {subroles.isError && <Loading isError>Failed to Load</Loading>}
                    {subroles.data &&
                        <Controller
                            name={`${name}.subRole.id`}
                            defaultValue={defaultValues[`${name}.subRole.id`]}
                            control={control}
                            render={({field}) => (
                                <Form.Control {...field} as="select" ref={ref} onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                    <option></option>
                                    {subroles.data.map(r=><option key={r[0]} value={r[0]}>{r[1]}</option>)}
                                </Form.Control>
                            )}
                        />
                    }
                    <Form.Control.Feedback type="invalid">{get(errors,`${name}.subRole.id.message`,'')}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Start Date*:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name={`${name}.startDate`}
                            control={control}
                            defaultValue={getValues('effDate')}
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
                    <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}.startDate`,false)?'block':'none'}}>{get(errors,`${name}.startDate.message`,'')}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>End Date*:</Form.Label>
                <Col xs="auto">
                    <InputGroup>
                        <Controller
                            name={`${name}.endDate`}
                            defaultValue={defaultValues[`${name}.endDate`]}
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
                    <Form.Control.Feedback type="invalid" style={{display:get(errors,`${name}.endDate`,false)?'block':'none'}}>{get(errors,`${name}.endDate.message`,'')}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            {(subRoleId=='Instructor'||showInTest)&&
                <Form.Group as={Row} className={testHighlight(subRoleId=='Instructor')}>
                    <Form.Label column md={2}>Tenure Status:</Form.Label>
                    <Col xs="auto">
                        {tenurestatus.isLoading && <Loading>Loading Data</Loading>}
                        {tenurestatus.isError && <Loading isError>Failed to Load</Loading>}
                        {tenurestatus.data &&
                            <Controller
                                name={`${name}.tenureStatus.id`}
                                defaultValue={defaultValues[`${name}.tenureStatus`]}
                                control={control}
                                render={({field}) => (
                                    <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={!canEdit}>
                                        <option></option>
                                        {tenurestatus.data.map(s=><option key={s[0]} value={s[0]}>{s[1]}</option>)}
                                    </Form.Control>
                                )}
                            />
                        }
                    </Col>
                </Form.Group>
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Hours/Week*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.hoursPerWeek`}
                        defaultValue={defaultValues[`${name}.hoursPerWeek`]}
                        control={control}
                        render={({field}) => <Form.Control {...field} type="number" min={1} max={40} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                    />
                    <Form.Control.Feedback type="invalid">{get(errors,`${name}.hoursPerWeek.message`,'')}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Service Type*:</Form.Label>
                <Col xs="auto">
                    {servicetypes.isLoading && <Loading>Loading Data</Loading>}
                    {servicetypes.isError && <Loading isError>Failed to Load</Loading>}
                    {servicetypes.data &&
                        <Controller
                            name={`${name}.serviceType.id`}
                            defaultValue={defaultValues[`${name}.serviceType`]}
                            control={control}
                            render={({field}) => (
                                <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}>
                                    <option></option>
                                    {servicetypes.data.map(s=><option key={s[0]} value={s[0]}>{s[1]}</option>)}
                                </Form.Control>
                            )}
                        />
                    }
                    <Form.Control.Feedback type="invalid">{get(errors,`${name}.serviceType.id.message`,'')}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            <Form.Group as={Row}>
                <Form.Label column md={2}>Department*:</Form.Label>
                <Col xs="auto">
                    <Controller
                        name={`${name}.department.id`}
                        control={control}
                        defaultValue={defaultValues[`${name}.department`]}
                        render={({field}) => <DepartmentSelector field={field} onChange={e=>handleSelectChange(e,field)} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                    />
                    <Form.Control.Feedback type="invalid">{get(errors,`${name}.department.id.message`,'')}</Form.Control.Feedback>
                </Col>
            </Form.Group>
            {(subRoleId&&subRoleId.startsWith('CP')||showInTest)&& 
                <VolunteerSupervisor fieldName={`${name}.univOfficial`} fieldLabel="Responsible Univ Official*" testHighlight={testHighlight(subRoleId&&subRoleId.startsWith('CP'))}/>
            }
            {(subRoleId&&!subRoleId.startsWith('CP')||showInTest)&& 
                <VolunteerSupervisor fieldName={`${name}.supervisor`} fieldLabel="Supervisor*" testHighlight={testHighlight(subRoleId&&!subRoleId.startsWith('CP'))}/>
            }
            <Form.Group as={Row}>
                <Form.Label column md={2}>Duties*:</Form.Label>
                <Col xs={12} sm={10} md={8} lg={6}>
                    <Controller
                        name={`${name}.duties`}
                        defaultValue={defaultValues[`${name}.duties`]}
                        control={control}
                        render={({field}) => <Form.Control {...field} as="textarea" rows={4} isInvalid={!!get(errors,field.name,false)} disabled={!canEdit}/>}
                    />
                    <Form.Control.Feedback type="invalid">{get(errors,`${name}.duties.message`,'')}</Form.Control.Feedback>
                </Col>
            </Form.Group>
        </article>
    );
}

function VolunteerSupervisor({fieldName,fieldLabel,testHighlight}) {
    const { control, getValues, setValue, formState: { errors } } = useFormContext();
    const { canEdit, defaultValues } = useHRFormContext();
    const [searchFilter,setSearchFilter] = useState('');
    const { getSupervisorNames } = useFormQueries();
    const supervisors = getSupervisorNames(searchFilter,{enabled:false});

    const handleSearch = query => setSearchFilter(query);
    const handleBlur = (field,e) => {
        field.onBlur(e);
        if (e.target.value != getValues(`${fieldName}[0].label`)) {
            setValue(`${fieldName}.0`,{id:'new-id-0',label:e.target.value});
        }
    }
    useEffect(() => searchFilter&&supervisors.refetch(),[searchFilter]);
    return (
        <Form.Group as={Row} className={testHighlight}>
            <Form.Label column md={2}>{fieldLabel}:</Form.Label>
            <Col xs={10} sm={8} md={6} lg={5} xl={4}>
                <Controller
                    name={fieldName}
                    control={control}
                    defaultValue={defaultValues[fieldName]}
                    render={({field}) => <AsyncTypeahead
                        {...field}
                        filterBy={()=>true}
                        id={`${fieldName.replaceAll('.','-')}-search`}
                        isLoading={supervisors.isLoading}
                        minLength={2}
                        flip={true} 
                        allowNew={true}
                        onSearch={handleSearch}
                        onBlur={e=>handleBlur(field,e)}
                        options={supervisors.data}
                        placeholder="Search for people..."
                        selected={field.value}
                        disabled={!canEdit}
                        isInvalid={!!get(errors,fieldName,false)}
                    />}
                />
                <Form.Control.Feedback type="invalid">{get(errors,`${fieldName}.message`,'')}</Form.Control.Feedback>
            </Col>
        </Form.Group>
    );
}
