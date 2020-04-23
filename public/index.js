/* global BpmnJS, download, DiagramJSMinimap, BpmnJSBpmnlint, BpmnlintRules, BpmnJSServiceTaskOnly, FileDrops */


// bootstrap BPMN modeler ////////////

var bpmnEditor = new BpmnJS({
  container: '#canvas'
});


// helpers //////////////////////////

/**
 * Open diagram in our modeler instance.
 *
 * @param {String} bpmnXML diagram to display
 */
function openDiagram(bpmnXML) {

  // import diagram
  bpmnEditor.importXML(bpmnXML, function(err) {

    if (err) {
      return console.error('could not import BPMN 2.0 diagram', err);
    }

  });
}


var file = { name: 'diagram.bpmn' };

/**
 * Save diagram contents and print them to the console.
 */
function downloadSVG() {
  bpmnEditor.saveSVG((err, svg) => {

    if (err) {
      return console.error('Failed to save SVG', err);
    }

    return download(svg, file.name + '.svg', 'application/xml');
  });
}

// wire save button
document.querySelector('#download-svg').addEventListener('click', downloadSVG);

function downloadBPMN() {
  bpmnEditor.saveXML({ format: true }, (err, xml) => {

    if (err) {
      return console.error('Failed to save XML', err);
    }

    return download(xml, file.name, 'application/xml');
  });
}

// wire save button
document.querySelector('#download-bpmn').addEventListener('click', downloadBPMN);

var dropHandler = FileDrops('Drop a BPMN diagram', function(files) {

  if (files.length) {
    file = files[0];

    openDiagram(file.contents);
  }
});

document.querySelector('body').addEventListener('dragover', dropHandler);

window.addEventListener('load', function() {

  // fetch default diagram via AJAX and open it
  fetch('./diagram.bpmn').then(r => r.text()).then(openDiagram);
});