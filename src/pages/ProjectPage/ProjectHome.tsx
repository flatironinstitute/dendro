import { Edit, Settings } from "@mui/icons-material";
import { FunctionComponent, useCallback, useEffect, useMemo, useState } from "react";
import { useModalWindow } from "@fi-sci/modal-window"
import { Hyperlink } from "@fi-sci/misc";
import ModalWindow from "@fi-sci/modal-window";
import { SmallIconButton } from "@fi-sci/misc";
import { timeAgoString } from "../../timeStrings";
import useRoute, { Route } from "../../useRoute";
import { useProject } from "./ProjectPageContext";
import ProjectSettingsWindow from "./ProjectSettingsWindow";
import ComputeResourceNameDisplay from "../../ComputeResourceNameDisplay";
import ComputeResourceSection from "./ComputeResourceSection";
import { IconButton } from "@mui/material";
import { setProjectAnalysisSourceUrl } from "../../dbInterface/dbInterface";
import { useGithubAuth } from "../../GithubAuth/useGithubAuth";
import Markdown from "../../Markdown/Markdown";

type Props = {
    width: number
    height: number
}

const headingStyle: React.CSSProperties = {
    fontSize: 20,
    fontWeight: 'bold',
}

const ProjectHome: FunctionComponent<Props> = ({width, height}) => {
    const {setRoute, route} = useRoute()
    const {project, files, jobs, projectId, projectRole, refreshProject} = useProject()

    const {visible: settingsWindowVisible, handleOpen: openSettingsWindow, handleClose: closeSettingsWindow} = useModalWindow()

    const associatedDandisetElements = useMemo(() => {
        if (!project) return undefined
        return project.tags.map(tag => {
            if (tag.startsWith('dandiset.')) {
                const dandisetId = tag.slice('dandiset.'.length)
                return (
                    <span key={dandisetId}>
                        <a href={`https://dandiarchive.org/dandiset/${dandisetId}`} target="_blank" rel="noreferrer">
                            {dandisetId}
                        </a>
                        &nbsp;&nbsp;
                    </span>
                )
            }
            else if (tag.startsWith('dandiset-staging.')) {
                const dandisetId = tag.slice('dandiset-staging.'.length)
                return (
                    <>
                        <a key={dandisetId} href={`https://gui-staging.dandiarchive.org/dandiset/${dandisetId}`} target="_blank" rel="noreferrer">
                            staging-{dandisetId}
                        </a>
                        &nbsp;&nbsp;
                    </>
                )
            }
            else return undefined
        }).filter(tag => tag !== undefined)
    }, [project])

    const auth = useGithubAuth()

    const handleEditAnalysisSourceUrl = useCallback(async () => {
        if (!project) return
        const newAnalysisSourceUrl = prompt('Enter new analysis source URL:', project.analysisSourceUrl || '')
        if (newAnalysisSourceUrl != null) {
            await setProjectAnalysisSourceUrl(project.projectId, newAnalysisSourceUrl, auth)
            refreshProject()
        }
    }, [project, auth, refreshProject])

    return (
        <div className="ProjectHome" style={{position: 'absolute', width, height, overflowY: 'auto', padding: 10, background: 'white'}}>
            <div style={headingStyle}>Project: {project?.name}</div>
            &nbsp;
            <table className="table1" style={{maxWidth: 800}}>
                <tbody>
                    <tr key="project-name">
                        <td>Project name:</td>
                        <td>{project?.name}</td>
                    </tr>
                    <tr key="project-id">
                        <td>Project ID:</td>
                        <td>{project?.projectId}</td>
                    </tr>
                    <tr key="associated-dandisets">
                        <td>Associated dandisets</td>
                        <td>
                            <span>{
                                associatedDandisetElements?.length
                                    ? associatedDandisetElements
                                    : 'None'
                            }</span>
                            &nbsp;
                            <SmallIconButton icon={<Edit />} onClick={() => {
                                setRoute({...route, tab: 'dandi-import'} as Route)
                            }} />
                        </td>
                    </tr>
                    <tr key="compute-resource">
                        <td>Compute resource:</td>
                        <td>{project ? <ComputeResourceNameDisplay computeResourceId={project.computeResourceId || undefined} link={true} /> : ''}</td>
                    </tr>
                    <tr key="created">
                        <td>Created:</td>
                        <td>{timeAgoString(project?.timestampCreated)}</td>
                    </tr>
                    <tr key="modified">
                        <td>Modified:</td>
                        <td>{timeAgoString(project?.timestampModified)}</td>
                    </tr>
                    <tr key="num-files">
                        <td>Num. files:</td>
                        <td>{files?.length} (<Hyperlink onClick={() => setRoute({page: 'project', projectId, tab: 'project-files'})}>view files</Hyperlink>)</td>
                    </tr>
                    <tr key="num-jobs">
                        <td>Num. jobs:</td>
                        <td>{jobs?.length} (<Hyperlink onClick={() => setRoute({page: 'project', projectId, tab: 'project-jobs'})}>view jobs</Hyperlink>)</td>
                    </tr>
                    <tr key="linked-analysis">
                        <td>Linked analysis:</td>
                        <td>
                            {project?.analysisSourceUrl && <a href={project?.analysisSourceUrl} target="_blank" rel="noreferrer">{project?.analysisSourceUrl}</a>}&nbsp;
                            {['editor', 'admin'].includes(projectRole || '') && <IconButton onClick={handleEditAnalysisSourceUrl}><Edit /></IconButton>}
                        </td>
                    </tr>
                </tbody>
            </table>

            <div>&nbsp;</div><hr /><div>&nbsp;</div>

            <div style={headingStyle}>Description</div>
            <br />
            <div>
                <div style={{maxHeight: 300, overflowY: 'auto'}}>
                    <Markdown
                        source={project?.description || ''}
                    />
                </div>
                <br />
                {['editor', 'admin'].includes(projectRole || '') && (
                    <EditProjectDescription />
                )}
            </div>
            
            <div>&nbsp;</div><hr /><div>&nbsp;</div>

            <div style={headingStyle}>Compute resource</div>

            <ComputeResourceSection />
            
            <div>&nbsp;</div><hr /><div>&nbsp;</div>

            <div style={{paddingTop: 10}}>
                <button onClick={openSettingsWindow} title="Project settings"><SmallIconButton icon={<Settings />} /> Project Settings</button>
            </div>

            <div>&nbsp;</div><hr /><div>&nbsp;</div>
            
            
            <ModalWindow
                visible={settingsWindowVisible}
                onClose={closeSettingsWindow}
            >
                <ProjectSettingsWindow />
            </ModalWindow>
        </div>
    )
}

const EditProjectDescription: FunctionComponent = () => {
    const {project, setProjectDescription} = useProject()
    const description = project?.description || ''
    const [editing, setEditing] = useState<boolean>(false)
    const [editedDescription, setEditedDescription] = useState<string>('')
    useEffect(() => {
        setEditedDescription(description)
    }, [description])
    const handleSave = useCallback(async () => {
        await setProjectDescription(editedDescription)
        setEditing(false)
    }, [editedDescription, setProjectDescription])
    if (editing) {
        return (
            <div>
                <textarea
                    style={{width: 800, height: 200}}
                    value={editedDescription}
                    onChange={e => setEditedDescription(e.target.value)}
                />
                <div>&nbsp;</div>
                <button onClick={() => {
                    setEditedDescription(description)
                    setEditing(false)
                }}>Cancel</button>
                &nbsp;&nbsp;&nbsp;&nbsp;
                <button onClick={handleSave}>Save</button>
            </div>
        )
    }
    else {
        return (
            <Hyperlink onClick={() => {
                setEditedDescription(description)
                setEditing(true)
            }}>Edit</Hyperlink>
        )
    }
}

export default ProjectHome