/* global BpmnJS, download, DiagramJSMinimap, BpmnJSBpmnlint, BpmnlintRules, BpmnJSServiceTaskOnly, FileDrops */


// bootstrap BPMN modeler ////////////

var bpmnEditor = new BpmnJS({
  container: '#canvas',
  linting: {
    bpmnlint: BpmnlintRules
  },
  additionalModules: [
    DiagramJSMinimap,
    BpmnJSBpmnlint,
    BpmnJSServiceTaskOnly
  ]
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

    // get hold on canvas
    var canvas = bpmnEditor.get('canvas');

    // zoom to fit full viewport
    canvas.zoom('fit-viewport');

    // get hold on overlays service
    var overlays = bpmnEditor.get('overlays');

    // attach an overlay to a diagram element
    overlays.add('ChooseReciepe', 'note', {
      position: {
        bottom: 10,
        right: 40
      },
      html: '<div class="diagram-note">Why not do fast food instead?</div>'
    });
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

const dropHandler = FileDrops('Drop a BPMN diagram', function(files) {

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