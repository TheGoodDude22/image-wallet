import { Form, Icon, LaunchProps } from "@raycast/api";
import { usePromise } from "@raycast/utils";

import { useState } from "react";

import { walletPath, fetchFiles, fetchPocketNames } from "./utils";

export default function Command(props: LaunchProps) {
  const [nameError, setNameError] = useState<string | undefined>();

  function dropNameErrorIfNeeded() {
    if (nameError && nameError.length > 0) {
      setNameError(undefined);
    }
  }

  const {
    isLoading: arePocketsLoading,
    data: pocketData,
    revalidate: revalidatePockets,
  } = usePromise(loadPocketNodes);

  return (
    <Form
      enableDrafts={true}
    >
      <Form.TextField
        id="cardName"
        title="Card Name"
        defaultValue={props.draftValues?.cardName}
        error={nameError}
        onChange={dropNameErrorIfNeeded}
        onBlur={(event) => {
          if (event.target.value?.length == 0) {
            setNameError("The field should't be empty!");
          } else {
            dropNameErrorIfNeeded();
          }
        }}
      />
      <Form.Dropdown
        id="pocket"
        title="Pocket"
        defaultValue={props.draftValues?.pocket}
        isLoading={arePocketsLoading}
      >
        {pocketData}
      </Form.Dropdown>

    </Form>
  );

  async function loadPocketNodes() {
    const pocketNames = fetchPocketNames();

    return [
      <Form.Dropdown.Item title="No Pocket" value=".unsorted" key=".unsorted" icon={Icon.Filter} />,
      <Form.Dropdown.Section title="Pockets" key="Section">
        {pocketNames.map((name) => (
          <Form.Dropdown.Item title={name} value={name} key={name} />
        ))}
      </Form.Dropdown.Section>,
    ];
  }
}