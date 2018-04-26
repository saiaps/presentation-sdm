import { Success } from '@atomist/automation-client';
/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import { doWithJson } from "@atomist/automation-client/project/util/jsonUtils";
import { findAuthorName } from "../../generators/common/findAuthorName";
import { ProjectEditor, successfulEdit } from '@atomist/automation-client/operations/edit/projectEditor';

export function updateBuildScripts(presentationFileName: string): ProjectEditor {
    return async (project, context) => {
        const seedPresentation = "seamaps";
        const newPresentation = presentationFileName.replace(/\.key$/, "")
        logger.info("Updating build scripts");
        updateContent(await project.getFile("build.sh"),
            c => c.replace(seedPresentation, newPresentation));
        updateContent(await project.getFile("key-to-pdf.applescript"),
            c => c.replace(seedPresentation, newPresentation));
        return successfulEdit(project, true);
    };
}

function updateContent(file, f: (s: string) => string): Promise<any> {
    return file.getContent().then(c => file.setContent(f(c)));
}

export function resetReadme(presentationFileName: string): ProjectEditor {
    return async (project, context) => {
        const newPresentation = presentationFileName.replace(/\.key$/, "")
        logger.info("Updating build scripts");
        const f = await project.getFile("README.md");
        f.setContent(`# Presentation ${newPresentation}
        
This repository supplies the PDF. If you want the keynote file, 
email Jess or ping @jessitron on twitter.

License CC0, ideas are for spreading
`);
        return successfulEdit(project, true);
    };
}

export function removeFile(outputFileName: string): ProjectEditor {
    return async (project, context) => {
        await project.deleteFile(outputFileName);
        return successfulEdit(project, true);
    };
}