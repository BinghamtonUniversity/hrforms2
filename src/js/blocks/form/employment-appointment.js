import React, { useState, useEffect, useMemo } from "react";
import { Row, Col, Form, InputGroup } from "react-bootstrap";
import { AsyncTypeahead } from "react-bootstrap-typeahead";
import { useFormContext, Controller, useWatch } from "react-hook-form";
import { HRFormContext, useHRFormContext } from "../../config/form";
import useFormQueries from "../../queries/forms";
import { Loading, DepartmentSelector } from "../components";
import { Icon } from "@iconify/react";
import DatePicker from "react-datepicker";
import useListsQueries from "../../queries/lists";

const baseName = 'employment.appointment';

export default function EmploymentAppointment() {
    const { canEdit, activeNav } = useHRFormContext();

    const { control, getValues, setValue } = useFormContext();
    const watchPayroll = useWatch({name:['payroll.PAYROLL_CODE','selectedRow.PAYROLL_AGENCY_CODE'],control:control});
    const watchFaculty = useWatch({name:`${baseName}.DERIVED_FAC_TYPE`,control:control});
    const watchTermDuration = useWatch({name:`${baseName}.TERM_DURATION`,control:control,defaultValue:0});
    const watchFields = useWatch({name:[
        'payroll.PAYROLL_CODE',
        'employment.position.APPOINTMENT_TYPE.id',
        `${baseName}.DERIVED_FAC_TYPE`,
        `${baseName}.TENURE_STATUS.id`,
    ],contorl:control});

    const handleRangeChange = e => setValue(`${baseName}.TERM_DURATION`,e.target.value);

    const { getListData } = useListsQueries();
    const tenure = getListData('tenureStatus');

    const handleSelectChange = (e,field) => {
        field.onChange(e);
        const nameBase = field.name.split('.').slice(0,-1).join('.');
        setValue(`${nameBase}.label`,e.target.selectedOptions?.item(0)?.label);
    }
    const displayTermDuration = useMemo(() => {
        if (watchFields[0] == '28020'&&['TEMP','TERM'].includes(watchFields[1])) {
            if (watchFields[2]=='Y'&&['R','N'].includes(watchFields[3])) return true;
            if (watchFields[2]!='Y') return true;
        }
        return false;
    },[watchFields]);

    useEffect(() => {
        const field = document.querySelector(`#${activeNav} input:not([disabled])`);
        (canEdit&&field)&&field.focus({focusVisible:true});
    },[activeNav]);
    
    return (
        <HRFormContext.Consumer>
            {({showInTest,testHighlight,canEdit}) => (
                <article className="mt-3">
                    <Row as="header">
                        <Col as="h3">Appointment Details</Col>
                    </Row>
                    {((watchPayroll[0]=='28020'&&watchPayroll[1]=='')||showInTest) &&
                        <Form.Group as={Row} className={testHighlight((watchPayroll[0]=='28020'&&watchPayroll[1]==''))}>
                            <Form.Label column md={2}>Faculty:</Form.Label>
                            <Col xs="auto" className="pt-2">
                                <Controller
                                    name={`${baseName}.DERIVED_FAC_TYPE`}
                                    defaultValue={false}
                                    control={control}
                                    render={({field}) => (
                                        <>
                                            <Form.Check {...field} inline type="radio" label="Yes" value="Y" checked={field.value=='Y'} disabled={!canEdit}/>
                                            <Form.Check {...field} inline type="radio" label="No" value="N" checked={field.value!='Y'} disabled={!canEdit}/>
                                        </>
                                    )}
                                />
                            </Col>
                        </Form.Group>
                    }
                    {(watchFaculty=='Y'||showInTest) &&
                        <Form.Group as={Row} className={testHighlight(watchFaculty=='Y')}>
                            <Form.Label column md={2}>Tenure Status:</Form.Label>
                            <Col xs="auto">
                                {tenure.isLoading && <Loading>Loading Data</Loading>}
                                {tenure.isError && <Loading isError>Failed to Load</Loading>}
                                {tenure.data &&
                                    <Controller
                                        name={`${baseName}.TENURE_STATUS.id`}
                                        control={control}
                                        render={({field}) => (
                                            <>
                                                <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={!canEdit}>
                                                    <option></option>
                                                    {tenure.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                                </Form.Control>
                                            </>
                                        )}
                                    />
                                }
                            </Col>
                        </Form.Group>
                    }
                    {(displayTermDuration||showInTest) && 
                        <Form.Group as={Row} className={testHighlight(displayTermDuration)}>
                            <Form.Label column md={2}>Term Duration:</Form.Label>
                            <Col xs="auto">
                                <Controller
                                    name={`${baseName}.TERM_DURATION`}
                                    defaultValue=""
                                    control={control}
                                    rules={{min:{value:1,message:'Term Duration cannot be less than 0'},max:{value:5,message:'Term Duration cannot be greater than 5'}}}
                                    render={({field}) => <Form.Control {...field} type="number" min={1} max={5} disabled={!canEdit}/>}
                                />
                            </Col>
                            <Col sm={8} md={6} className="pt-2">
                                <Form.Control type="range" name="termDurationRange" id="termDurationRange" min={1} max={5} value={watchTermDuration} onChange={handleRangeChange} disabled={!canEdit}/>
                            </Col>
                        </Form.Group>
                    }
                    {(getValues(`${baseName}.NOTICE_DATE`)||showInTest) && 
                        <>
                            <Form.Group as={Row} className={testHighlight(getValues(`${baseName}.NOTICE_DATE`))}>
                                <Form.Label column md={2}>Notice Date:</Form.Label>
                                <Col xs="auto">
                                <InputGroup>
                                    <Controller
                                        name={`${baseName}.noticeDate`}
                                        control={control}
                                        render={({field}) => <Form.Control
                                            as={DatePicker}
                                            name={field.name}
                                            selected={field.value}
                                            closeOnScroll={true}
                                            onChange={field.onChange}
                                            autoComplete="off"
                                            disabled={!canEdit}
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
                            <Form.Group as={Row} className={testHighlight(getValues(`${baseName}.CONTINUING_PERMANENCY_DATE`))}>
                                <Form.Label column md={2}>Continuing/Permanency Date:</Form.Label>
                                <Col xs="auto">
                                <InputGroup>
                                    <Controller
                                        name={`${baseName}.contPermDate`}
                                        control={control}
                                        render={({field}) => <Form.Control
                                            as={DatePicker}
                                            name={field.name}
                                            selected={field.value}
                                            closeOnScroll={true}
                                            onChange={field.onChange}
                                            autoComplete="off"
                                            disabled={!canEdit}
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
                        </>
                    }
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Campus Title:</Form.Label>
                        <Col xs={10} sm={9} md={8} lg={6} xl={5}>
                            <Controller
                                name={`${baseName}.CAMPUS_TITLE`}
                                control={control}
                                render={({field})=><Form.Control {...field} type="text" disabled={!canEdit}/>}
                            />
                        </Col>
                    </Form.Group>

                    <AppointmentSupervisor/>

                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Department:</Form.Label>
                        <Col xs="auto">
                            <Controller
                                name={`${baseName}.REPORTING_DEPARTMENT_CODE.id`}
                                control={control}
                                defaultValue=""
                                render={({field}) => <DepartmentSelector field={field} onChange={e=>handleSelectChange(e,field)} disabled={!canEdit}/>}
                            />
                        </Col>
                    </Form.Group>

                    {(watchFaculty=='Y'||showInTest)&&<FacultyDetails watchFaculty={watchFaculty}/>}

                    {(watchPayroll[0]=='28029'||showInTest)&&<StudentDetails watchPayroll={watchPayroll} handleSelectChange={handleSelectChange}/>}
                </article>
            )}
        </HRFormContext.Consumer>
    );
}
function AppointmentSupervisor() {
    const { control, getValues, setValue } = useFormContext();
    const { canEdit } = useHRFormContext();
    const [searchFilter,setSearchFilter] = useState('');
    const { getSupervisorNames } = useFormQueries();
    const supervisors = getSupervisorNames(searchFilter,{enabled:false});

    const handleSearch = query => setSearchFilter(query);
    const handleBlur = (field,e) => {
        field.onBlur(e);
        if (e.target.value != getValues(`${baseName}.supervisor[0].label`)) {
            setValue(`${baseName}.supervisor.0`,{id:'new-id-0',label:e.target.value});
        }
    }
    useEffect(() => searchFilter&&supervisors.refetch(),[searchFilter]);
    return (
        <Form.Group as={Row}>
            <Form.Label column md={2}>Supervisor:</Form.Label>
            <Col xs={10} sm={8} md={6} lg={5} xl={4}>
                <Controller
                    name={`${baseName}.supervisor`}
                    control={control}
                    render={({field}) => <AsyncTypeahead
                        {...field}
                        filterBy={()=>true}
                        id="supervisor-search"
                        isLoading={supervisors.isLoading}
                        minLength={2}
                        flip={true} 
                        allowNew={true}
                        onSearch={handleSearch}
                        onBlur={e=>handleBlur(field,e)}
                        options={supervisors.data}
                        placeholder="Search for supervisor..."
                        selected={field.value}
                        disabled={!canEdit}
                    />}
                />
            </Col>
        </Form.Group>
    );
}

function FacultyDetails({watchFaculty}) {
    const name = `${baseName}.facultyDetails`;
    const { control, setValue } = useFormContext();
    const watchCourses = useWatch({name:[`${name}.fallCourses`,`${name}.springCourses`,],control:control})||0;

    const handleRangeChange = (e,fieldName) => setValue(fieldName,e.target.value);

    return (
        <HRFormContext.Consumer>
            {({testHighlight,canEdit}) => (
                <section className={`mt-4 ${testHighlight(watchFaculty=='Y')}`}>
                    <Row as="header">
                        <Col as="h4">Faculty Details</Col>
                    </Row>
                    {[
                        {id:'fallCourses',label:'Fall Courses'},
                        {id:'springCourses',label:'Spring Courses'}
                    ].map((c,i) => (
                        <div key={c.id} id={c.id}>
                            <Form.Group as={Row}>
                                <Form.Label column md={2}>{c.label}:</Form.Label>
                                <Col xs="auto">
                                    <Controller
                                        name={`${name}.${c.id}.count`}
                                        defaultValue=""
                                        control={control}
                                        rules={{min:{value:0,message:`${c.label} cannot be less than 0`},max:{value:20,message:`${c.label} cannot be greater than 20`}}}
                                        render={({field}) => <Form.Control {...field} type="number" min={0} max={20} disabled={!canEdit}/>}
                                    />
                                </Col>
                                <Col sm={8} md={6} className="pt-2">
                                    <Form.Control type="range" name={`${c.id}Range`} id={`${c.id}Range`} min={0} max={20} value={watchCourses[i].count} onChange={e=>handleRangeChange(e,`${name}.${c.id}.count`)} disabled={!canEdit}/>
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label column md={2}>Credits:</Form.Label>
                                <Col xs="auto">
                                    <Controller
                                        name={`${name}.${c.id}.credits`}
                                        defaultValue=""
                                        control={control}
                                        rules={{min:{value:0,message:`${c.label} cannot be less than 0`}}}
                                        render={({field}) => <Form.Control {...field} type="number" min={0} disabled={!canEdit}/>}
                                    />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label column md={2}>{c.label} List:</Form.Label>
                                <Col md={9}>
                                    <Controller
                                        name={`${name}.${c.id}.list`}
                                        defaultValue=""
                                        control={control}
                                        render={({field}) => <Form.Control {...field} as="textarea" rows={5} disabled={!canEdit}/>}
                                    />
                                </Col>
                            </Form.Group>
                        </div>
                    ))}
                </section>
            )}
        </HRFormContext.Consumer>
    );
}

function StudentDetails({watchPayroll,handleSelectChange}) {
    const name = `${baseName}.studentDetails`;

    const { control, getValues, setValue } = useFormContext();
    const watchCredits = useWatch({name:[`${name}.fall.credits`,`${name}.spring.credits`,],control:control})||0;
    const watchFellowship = useWatch({name:`${name}.fellowship`,control:control});
    const data = getValues(name);

    const handleRangeChange = (e,fieldName) => setValue(fieldName,e.target.value);

    const { getListData } = useListsQueries();
    const fellowshipsources = getListData('fellowshipSources');

    useEffect(()=>watchFellowship=='N' && setValue(`${name}.fellowshipSource`,{"id":"","label":""}),[watchFellowship]);
    return (
        <HRFormContext.Consumer>
            {({testHighlight,canEdit}) => (
                <section className={`mt-4 ${testHighlight(watchPayroll[0]=='28029')}`}>
                    <Row as="header">
                        <Col as="h4">Student Details</Col>
                    </Row>
                    <Row as="dl">
                        <Col as="dt" sm={2} className="mb-0">GPA:</Col>
                        <Col as="dd" sm={4} className="mb-0">{Number.parseFloat(data.SHRLGPA_GPA).toFixed(2)}</Col>
                        <Col as="dt" sm={2} className="mb-0">Incompletes:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.INCOMPLETES}</Col>
                        <Col as="dt" sm={2} className="mb-0">Missing Grades:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.MISSING_GRADES}</Col>
                        <Col as="dt" sm={2} className="mb-0">Grade Level</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.STVCLAS_CODE} - {data.STVCLAS_DESC}</Col>
                        <Col as="dt" sm={2} className="mb-0">Last Term:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.STVTERM_DESC} ({data.SGBSTDN_TERM_CODE_EFF})</Col>
                        <Col as="dt" sm={2} className="mb-0">Program:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.SMRPRLE_PROGRAM_DESC}</Col>
                        <Col as="dt" sm={2} className="mb-0">Major:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.STVMAJR_DESC}</Col>
                        <Col as="dt" sm={2} className="mb-0">Academic History:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.ACAD_HIST}</Col>
                        <Col as="dt" sm={2} className="mb-0">Residency:</Col>
                        <Col as="dd" sm={4} className="mb-0">{data.STVRESD_DESC} / {data.STVRESD_IN_STATE_DESC}</Col>
                    </Row>
                    {[
                        {id:'fall',label:'Fall'},
                        {id:'spring',label:'Spring'}
                    ].map((c,i) => (
                        <div key={c.id} id={c.id}>
                            <Form.Group as={Row}>
                                <Form.Label column md={2}>{c.label} Tuition:</Form.Label>
                                <Col xs={12} sm={6} md={4} lg={3}>
                                    <Controller
                                        name={`${name}.${c.id}.tuition`}
                                        defaultValue=""
                                        control={control}
                                        render={({field}) => <Form.Control {...field} type="text" disabled={!canEdit}/>}
                                    />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row}>
                                <Form.Label column md={2}>{c.label} Credits:</Form.Label>
                                <Col xs="auto">
                                    <Controller
                                        name={`${name}.${c.id}.credits`}
                                        defaultValue={0}
                                        control={control}
                                        rules={{min:{value:0,message:`${c.label} cannot be less than 0`},max:{value:30,message:`${c.label} cannot be greater than 30`}}}
                                        render={({field}) => <Form.Control {...field} type="number" min={0} max={30} disabled={!canEdit}/>}
                                    />
                                </Col>
                                <Col sm={8} md={6} className="pt-2">
                                    <Form.Control type="range" name={`${c.id}CreditsRange`} id={`${c.id}CreditsRange`} min={0} max={30} value={watchCredits[i]} onChange={e=>handleRangeChange(e,`${name}.${c.id}.credits`)} disabled={!canEdit}/>
                                </Col>
                            </Form.Group>
                        </div>
                    ))}
                    <Form.Group as={Row}>
                        <Form.Label column md={2}>Receiving Fellowship:</Form.Label>
                        <Col xs="auto" className="pt-2">
                            <Controller
                                name={`${name}.fellowship`}
                                defaultValue={false}
                                control={control}
                                render={({field}) => (
                                    <>
                                        <Form.Check {...field} inline type="radio" label="Yes" value="Y" checked={field.value=='Y'} disabled={!canEdit}/>
                                        <Form.Check {...field} inline type="radio" label="No" value="N" checked={field.value!='Y'} disabled={!canEdit}/>
                                    </>
                                )}
                            />
                        </Col>
                    </Form.Group>
                    {watchFellowship=='Y' && 
                        <Form.Group as={Row}>
                            <Form.Label column md={2}>Source of Fellowship:</Form.Label>
                            <Col xs="auto">
                                {fellowshipsources.isLoading && <Loading>Loading Data</Loading>}
                                {fellowshipsources.isError && <Loading isError>Failed to Load</Loading>}
                                {fellowshipsources.data &&
                                    <Controller
                                        name={`${name}.fellowshipSource.id`}
                                        control={control}
                                        render={({field}) => (
                                            <>
                                                <Form.Control {...field} as="select" onChange={e=>handleSelectChange(e,field)} disabled={!canEdit}>
                                                    <option></option>
                                                    {fellowshipsources.data.map(k=><option key={k[0]} value={k[0]}>{k[1]}</option>)}
                                                </Form.Control>
                                            </>
                                        )}
                                    />
                                }
                            </Col>
                        </Form.Group>
                    }
                </section>
            )}
        </HRFormContext.Consumer>
    );
}