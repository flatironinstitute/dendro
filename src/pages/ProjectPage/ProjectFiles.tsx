import { FunctionComponent, useCallback } from "react";
import { Splitter } from "@fi-sci/splitter";
import TabWidget from "../../TabWidget/TabWidget";
import FileBrowser2 from "./FileBrowser/FileBrowser2";
import FileView from "./FileView/FileView";
import { useProject } from "./ProjectPageContext";
import JobView from "./JobView/JobView";
import { confirm } from "../../confirm_prompt_alert";
import { DandiUploadTask } from "./DandiUpload/prepareDandiUploadTask";
import { PluginAction } from "../../plugins/DendroFrontendPlugin";
import { FileIcon } from "./FileBrowser/FileBrowserTable";

type ProjectFilesProps = {
    width: number
    height: number
    onRunBatchSpikeSorting?: (filePaths: string[]) => void
    onRunFileAction?: (actionName: string, filePaths: string[]) => void
    onOpenInNeurosift?: (filePaths: string[]) => void
    onDandiUpload?: (dandiUploadTask: DandiUploadTask) => void
    onUploadSmallFile?: () => void
    onAction?: (action: PluginAction) => void
}

const ProjectFiles: FunctionComponent<ProjectFilesProps> = ({width, height, onRunBatchSpikeSorting, onRunFileAction, onOpenInNeurosift, onDandiUpload, onUploadSmallFile, onAction}) => {
    const {files, openTab, deleteFile, closeTab, openTabs, refreshFiles, refreshJobs} = useProject()

    const handleOpenFile = useCallback((fileName: string) => {
        openTab(`file:${fileName}`)
    }, [openTab])

    const handleDeleteFile = useCallback(async (fileName: string) => {
        const okay = await confirm(`Delete ${fileName}?`)
        if (!okay) return
        deleteFile(fileName).then(() => {
            refreshFiles();
            refreshJobs(); // some jobs may have been affected by the file deletion
        })
        closeTab(`file:${fileName}`)
    }, [deleteFile, closeTab, refreshFiles, refreshJobs])

    if (!files) return <div>Loading project files...</div>

    return (
        <Splitter
            width={width}
            height={height}
            initialPosition={width / 2}
            direction="horizontal"
            hideSecondChild={openTabs.length === 0}
        >
            <FileBrowser2
                width={0}
                height={0}
                files={files}
                onOpenFile={handleOpenFile}
                onDeleteFile={handleDeleteFile}
                hideSizeColumn={false}
                onRunBatchSpikeSorting={onRunBatchSpikeSorting}
                onRunFileAction={onRunFileAction}
                onOpenInNeurosift={onOpenInNeurosift}
                onDandiUpload={onDandiUpload}
                onUploadSmallFile={onUploadSmallFile}
                onAction={onAction}
            />
            <ProjectTabWidget
                width={0}
                height={0}
            />
        </Splitter>
    )
}

const ProjectTabWidget: FunctionComponent<{width: number, height: number}> = ({width, height}) => {
    const {openTabs, currentTabName, setCurrentTab, closeTab} = useProject()
    return (
        <TabWidget
            width={width}
            height={height}
            tabs={
                openTabs.map(({tabName}) => ({
                    id: tabName,
                    label: labelFromTabName(tabName, {abbreviate: true}),
                    closeable: true,
                    icon: iconFromTabName(tabName),
                    title: labelFromTabName(tabName, {abbreviate: false})
                }))
            }
            currentTabId={currentTabName}
            setCurrentTabId={setCurrentTab}
            onCloseTab={fileName => closeTab(fileName)}
        >
            {openTabs.map(({tabName}) => (
                tabName.startsWith('file:') ? (
                    <FileView
                        key={tabName}
                        fileName={tabName.slice('file:'.length)}
                        width={0}
                        height={0}
                    />
                ) :
                tabName.startsWith('job:') ? (
                    <JobView
                        key={tabName}
                        jobId={tabName.slice('job:'.length)}
                        width={0}
                        height={0}
                    />
                ) :
                (
                    <div key={tabName}>Not implemented</div>
                )
            ))}
        </TabWidget>
    )
}

const maxTabLabelLength = 18

const labelFromTabName = (tabName: string, o: {abbreviate: boolean}) => {
    let ret = ''
    if (tabName.startsWith('file:')) {
        ret = tabName.slice('file:'.length)
    }
    else if (tabName.startsWith('job:')) {
        ret = 'job:' + tabName.slice('job:'.length)
    }
    else ret = tabName
    if (o.abbreviate) {
        if (ret.length > maxTabLabelLength) {
            ret = ret.slice(0, maxTabLabelLength - 3) + '...'
        }
    }
    return ret
}

const iconFromTabName = (tabName: string) => {
    if (tabName.startsWith('file:')) {
        return <FileIcon fileName={tabName.slice('file:'.length)} />
    }
    else return undefined
}

export default ProjectFiles